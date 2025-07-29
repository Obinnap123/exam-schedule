import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { startDate, weeks } = await request.json();

    if (!startDate || !weeks) {
      return NextResponse.json(
        { error: "Start date and duration (in weeks) are required" },
        { status: 400 }
      );
    }

    if (weeks < 1 || weeks > 10) {
      return NextResponse.json(
        { error: "Weeks must be between 1 and 10." },
        { status: 400 }
      );
    }

    const totalSessions = weeks * 5 * 2;

    const dbCourses = await prisma.course.findMany({
      select: {
        code: true,
        students: true,
        department: true,
      },
    });

    if (!dbCourses.length) {
      return NextResponse.json(
        {
          error: "No courses found in database. Please upload course data first.",
        },
        { status: 400 }
      );
    }

    // Generate session metadata
    const start = new Date(startDate);
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const sessionsMeta = [];

    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < 5; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + week * 7 + day);
        const dateString = currentDate.toISOString().split('T')[0];
        
        sessionsMeta.push(
          { 
            session: `Week ${week+1} ${dayNames[day]} Morning`, 
            date: dateString 
          },
          { 
            session: `Week ${week+1} ${dayNames[day]} Afternoon`, 
            date: dateString 
          }
        );
      }
    }

    const sessionDetails = sessionsMeta.map(s => 
      `- ${s.session} (${s.date})`
    ).join('\n');

    // Calculate utilizations for example
    const largeCourses = dbCourses.filter(c => c.students > 96);
    const smallCourses = dbCourses.filter(c => c.students <= 96);

    // ===== FIXED PROMPT =====
    const prompt = `
You are an expert exam scheduler. Generate a JSON timetable for exactly ${totalSessions} sessions.

ROOM CAPACITIES:
- RED: ≤ 96 students
- BLUE: ≤ 192 students

STRICT RULES:
1. Each course appears EXACTLY once
2. Courses >96 students → BLUE only (1 per session)
3. Courses ≤96 students → RED or BLUE
4. All students in one course sit in one color
5. Sessions can be completely empty

ASSIGNMENT STRATEGY:
1. Assign large courses to BLUE with small courses in RED
2. Combine small courses in remaining sessions
3. Leave unused sessions empty

SESSION LIST (Use exactly this order!):
${sessionDetails}

COURSE DATA:
${JSON.stringify(dbCourses, null, 2)}

EXAMPLE FORMAT ONLY (Do not copy exactly):
\`\`\`json
{
  "sessions": [
    {
      "session": "Week 1 Monday Morning",
      "date": "2025-07-21",
      "red": {
        "courses": [{"code": "MAT203", "students": 90}],
        "total": 90,
        "utilization": "93.8%"
      },
      "blue": {
        "courses": [{"code": "CSC101", "students": 150}],
        "total": 150,
        "utilization": "78.1%"
      }
    },
    {
      "session": "Week 1 Monday Afternoon",
      "date": "2025-07-21",
      "red": {
        "courses": [{"code": "CHEM206", "students": 95}],
        "total": 95,
        "utilization": "99.0%"
      },
      "blue": {
        "courses": [{"code": "BIO103", "students": 180}],
        "total": 180,
        "utilization": "93.8%"
      }
    }
  ]
}
\`\`\`

Return output in ONLY this format, inside triple backticks:
\`\`\`json
{
  "sessions": [
    {
      "session": "Week 1 Monday Morning",
      "date": "2025-07-21",
      "red": {"courses": [{"code": "MAT203", "students": 90}], "total": 90, "utilization": "93.8%"},
      "blue": {"courses": [{"code": "CSC101", "students": 150}], "total": 150, "utilization": "78.1%"}
    },
    ...
  ]
}
\`\`\`
`;

    let parsed;
    let validated;

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔁 Attempt ${attempt} to generate timetable...`);

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
        messages: [
          {
            role: "system",
            content:
              "You are an academic scheduling expert. Follow ALL seat constraints strictly and return ONLY valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No response from AI");

      const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/);
      if (!jsonMatch) throw new Error("AI did not return JSON in code block");

      try {
        parsed = JSON.parse(jsonMatch[1]);
        validated = timetableSchema.parse(parsed);

        // Strict seat capacity check
        for (const session of validated.sessions) {
          if (session.red.total > 96) {
            throw new Error(
              `Red seat overflow in ${session.session}: ${session.red.total} > 96`
            );
          }
          if (session.blue.total > 192) {
            throw new Error(
              `Blue seat overflow in ${session.session}: ${session.blue.total} > 192`
            );
          }
          
        }

        // Ensure each course appears only once
        const seenCourses = new Set<string>();
        for (const session of validated.sessions) {
          for (const color of ["red", "blue"] as const) {
            for (const course of session[color].courses) {
              const key = course.code;
              if (seenCourses.has(key)) {
                throw new Error(`Course "${key}" appears in multiple sessions.`);
              }
              seenCourses.add(key);
            }
          }
        }

        break; 
      } catch (err) {
        console.warn(`Attempt ${attempt} failed: ${err}`);
        if (attempt === 3) {
          throw new Error("Timetable generation failed after 3 retries.");
        }
      }
    }

    if (!validated) {
      throw new Error("No valid timetable could be generated.");
    }

    return NextResponse.json(validated.sessions, { status: 200 });
  } catch (error) {
    console.error("AI Timetable generation failed:", error);
    return NextResponse.json(
      { error: "Timetable generation failed", details: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}