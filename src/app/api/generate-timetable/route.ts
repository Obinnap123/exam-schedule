import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";
import { generatePhase1Prompt, generateSchedulingInfo } from "./prompts";
import type { z } from "zod";

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface Course {
  id?: number;
  code: string;
  title?: string;
  students: number;
  department?: string;
  level?: number;
}

type ValidatedTimetable = z.infer<typeof timetableSchema>;

// Helper function to calculate utilization percentage
const calculateUtilization = (total: number, capacity: number) => {
  return `${((total / capacity) * 100).toFixed(1)}%`;
};

// Helper function to check if courses can be paired
const canBePaired = (course1: any, course2: any, roomCapacity: number) => {
  return (course1.students + course2.students) <= roomCapacity;
};

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
        { error: "No courses found in database. Please upload course data first." },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const sessionsMeta = [];

    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < 5; day++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + week * 7 + day);
        const dateString = currentDate.toISOString().split("T")[0];

        sessionsMeta.push(
          { session: `Week ${week + 1} ${dayNames[day]} Morning`, date: dateString },
          { session: `Week ${week + 1} ${dayNames[day]} Afternoon`, date: dateString }
        );
      }
    }

    const sessionDetails = sessionsMeta
      .map((s) => `- ${s.session} (${s.date})`)
      .join("\n");

    const phase1Prompt = generatePhase1Prompt(dbCourses, totalSessions, sessionDetails);
    const schedulingInfo = generateSchedulingInfo(dbCourses, totalSessions);

    console.log('Starting timetable generation...');
    console.log('Total courses to schedule:', dbCourses.length);
    
    const completion1 = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
      messages: [
        { 
          role: "system", 
          content: "You are an expert academic scheduling system. Your task is to create efficient exam timetables that maximize room usage and follow all constraints." 
        },
        { 
          role: "user", 
          content: phase1Prompt + schedulingInfo 
        }
      ],
      temperature: 0.1, // Reduced temperature for more consistent output
      max_tokens: 3000,
    });
    
    console.log('Phase 1 Response:', completion1.choices[0]?.message?.content);

    const planningResponse = completion1.choices[0]?.message?.content;
    if (!planningResponse || !planningResponse.includes("PHASE 2 READY")) {
      throw new Error("Planning phase did not complete as expected.");
    }

    const promptPhase2 = `
You are a timetable generation expert. Generate a valid JSON timetable following this EXACT structure and rules.

YOUR COURSES:
LARGE COURSES (must be alone in BLUE room):
- CSE101 (120 students)
- ENG104 (150 students)
- CSE201 (110 students)

MEDIUM COURSES (use RED room when possible):
- MTH102 (95 students)
- PHY103 (80 students)
- MTH202 (85 students)
- PHY203 (70 students)
- CSE301 (90 students)
- CSE302 (75 students)
- CSE401 (65 students)

IMPORTANT: Generate a complete timetable with ALL courses scheduled.

⚠️ STRICT CAPACITY LIMITS - NEVER EXCEED THESE:
- RED ROOM: 96 STUDENTS MAXIMUM
- BLUE ROOM: 192 STUDENTS MAXIMUM

MANDATORY SCHEDULING RULES:

1. BLUE ROOM RULES (192 student maximum):
   ✓ Schedule ONE large course alone:
     - CSE101 (120) alone
     - ENG104 (150) alone
     - CSE201 (110) alone
   ✗ NEVER combine large courses
   ✗ NEVER exceed 192 total

2. RED ROOM RULES (96 student maximum):
   ✓ Schedule ONE medium course alone:
     - MTH102 (95)
     - PHY103 (80)
     - MTH202 (85)
     - PHY203 (70)
     - CSE301 (90)
     - CSE302 (75)
     - CSE401 (65)
   ✗ NEVER exceed 96 total
   ✗ NEVER use for large courses

SCHEDULING ORDER:
1. First: Schedule large courses (>96) in BLUE rooms
2. Then: Schedule medium courses (70-96) one at a time
3. Last: Schedule remaining small courses

CRITICAL CHECKS FOR EACH SESSION:
✓ RED room total ≤96
✓ BLUE room total ≤192
✓ Large courses only in BLUE
✓ Check combined totals before pairing

REMEMBER: 
- Every single course must be scheduled
- Don't leave rooms empty if there are unscheduled courses
- Use all available sessions if needed

ROOM RULES (CHECK THESE FOR EVERY SESSION):

RED ROOM (96 max):
✓ ALLOWED:
  - Single course with 70-96 students
  - Two smaller courses totaling ≤96
  - Leave empty if needed
✗ NOT ALLOWED:
  - ANY course >96 students
  - Multiple courses totaling >96
  - Three or more courses together

BLUE ROOM (192 max):
✓ ALLOWED:
  - Any course >96 students
  - Multiple smaller courses totaling ≤192
  - Leave empty if needed
✗ NOT ALLOWED:
  - Total students >192
  - Waste space if RED room is empty

CRITICAL CHECKS:
1. Each course MUST be scheduled exactly once
2. Check RED room total before assigning
3. Verify BLUE room capacity
4. Count total scheduled courses = input courses

EXAMPLE TIMETABLE WITH YOUR COURSES:
// This shows the EXACT structure you must follow
{
  "sessions": [
    {
      "session": "Week 1 Monday Morning",
      "date": "2025-07-21",
      "red": { 
        "courses": [
          {"code": "MTH102", "students": 95}
        ],
        "total": 95,
        "utilization": "99.0%"
      },
      "blue": {
        "courses": [
          {"code": "ENG104", "students": 150}
        ],
        "total": 150,
        "utilization": "78.1%"
      }
    },
    {
      "session": "Week 1 Monday Afternoon",
      "date": "2025-07-21",
      "red": { 
        "courses": [
          {"code": "PHY103", "students": 80}
        ],
        "total": 80,
        "utilization": "83.3%"
      },
      "blue": {
        "courses": [
          {"code": "CSE101", "students": 120}
        ],
        "total": 120,
        "utilization": "62.5%"
      }
    },
    {
      "session": "Week 1 Tuesday Morning",
      "date": "2025-07-22",
      "red": {
        "courses": [
          {"code": "MTH202", "students": 85}
        ],
        "total": 85,
        "utilization": "88.5%"
      },
      "blue": {
        "courses": [
          {"code": "CSE201", "students": 110}
        ],
        "total": 110,
        "utilization": "57.3%"
      }
    }
  ]
}

Use this exact JSON format. Study these VALID examples carefully:

\`\`\`json
{
  "sessions": [
    {
      "session": "Week 1 Monday Morning",
      "date": "2025-07-21",
      "red": {
        "courses": [
          {"code": "COURSE1", "students": 95}
        ],
        "total": 95,
        "utilization": "99.0%"
      },
      "blue": {
        "courses": [
          {"code": "COURSE2", "students": 150}
        ],
        "total": 150,
        "utilization": "78.1%"
      }
    },
    {
      "session": "Week 1 Monday Afternoon",
      "date": "2025-07-21",
      "red": {
        "courses": [
          {"code": "COURSE3", "students": 65},
          {"code": "COURSE4", "students": 30}
        ],
        "total": 95,
        "utilization": "99.0%"
      },
      "blue": {
        "courses": [
          {"code": "COURSE5", "students": 110}
        ],
        "total": 110,
        "utilization": "57.3%"
      }
    }
  ]
}
\`\`\`

Basic Rules:
1. RED room maximum: 96 students
2. BLUE room maximum: 192 students
3. Courses >96 students go in BLUE rooms
4. Each course must be scheduled exactly once
5. Use multiple sessions to schedule all courses

JSON Format Example:
\`\`\`json
{
  "sessions": [
    {
      "session": "Week 1 Monday Morning",
      "date": "2025-07-21",
      "red": {
        "courses": [{"code": "MTH102", "students": 95}],
        "total": 95,
        "utilization": "99.0%"
      },
      "blue": {
        "courses": [{"code": "ENG104", "students": 150}],
        "total": 150,
        "utilization": "78.1%"
      }
    }
  ]
}
\`\`\`

YOU MUST:
1. Include ALL courses in the schedule
2. Never exceed room capacities
3. Return valid JSON only

REQUIREMENTS:
- Include ALL courses
- Calculate correct totals and utilization
- Use both rooms efficiently
- Balance morning/afternoon sessions
- Spread department exams across days

Return ONLY valid JSON in the format shown.
`;

    let validated: ValidatedTimetable | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`\n=== Attempt ${attempt} ===`);
    
      // First, get planning from Phase 1
      const planningCompletion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
        messages: [
          { 
            role: "system", 
            content: "You are a timetable scheduling expert. Plan how to schedule these courses." 
          },
          { 
            role: "user", 
            content: `These are the courses to schedule: ${JSON.stringify(dbCourses, null, 2)}. Create a plan to schedule them.` 
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      console.log('Planning Phase Output:', planningCompletion.choices[0]?.message?.content);

      // Then generate the actual timetable
      const completion2 = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
        messages: [
          { 
            role: "system", 
            content: "You are a timetable generation expert. Generate a valid JSON timetable." 
          },
          {
            role: "assistant",
            content: planningCompletion.choices[0]?.message?.content || ""
          },
          { 
            role: "user", 
            content: promptPhase2 
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      });
    
      const response = completion2.choices[0]?.message?.content;
      console.log('\nGeneration Response:', response);

      if (!response) {
        console.log('Error: Empty response from OpenAI');
        continue;
      }      const content = completion2.choices[0]?.message?.content;
      if (!content) {
        console.warn(`Attempt ${attempt}: Empty GPT response.`);
        continue;
      }

      console.log(`🔍 GPT Raw Output (Attempt ${attempt}):\n`, content);

      // Try to extract JSON from markdown code blocks first
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonContent = jsonMatch ? jsonMatch[1] : content;

      // Clean up the JSON string
      jsonContent = jsonContent.trim();
      if (jsonContent.startsWith('"') && jsonContent.endsWith('"')) {
        jsonContent = jsonContent.slice(1, -1);
      }

      console.log('\nTrying to parse JSON:', jsonContent);

      try {
        const parsed = JSON.parse(jsonContent);
        console.log('\nSuccessfully parsed JSON:', JSON.stringify(parsed, null, 2));
        
        validated = timetableSchema.parse(parsed);
        console.log(`Attempt ${attempt} - Schema validation passed`);

        const seenCourses = new Set<string>();
        const seenDepartments = new Map<string, Set<string>>(); // Track departments by day
        
        for (const session of validated.sessions) {
          // Validate room capacities
          if (session.red.total > 96)
            throw new Error(`Red seat overflow in ${session.session}: ${session.red.total} students`);
          if (session.blue.total > 192)
            throw new Error(`Blue seat overflow in ${session.session}: ${session.blue.total} students`);

          // Extract day from session (e.g., "Week 1 Monday Morning" -> "Monday")
          const day = session.session.split(' ')[2];
          
          for (const color of ["red", "blue"] as const) {
            for (const course of session[color].courses) {
              // Check for duplicate courses
              if (seenCourses.has(course.code)) {
                throw new Error(`Course "${course.code}" appears in multiple sessions.`);
              }
              seenCourses.add(course.code);

              // Track department distribution
              const dept = dbCourses.find(c => c.code === course.code)?.department;
              if (dept) {
                if (!seenDepartments.has(day)) {
                  seenDepartments.set(day, new Set());
                }
                seenDepartments.get(day)!.add(dept);
              }

              // Validate course size constraints
              if (color === "red" && course.students > 96) {
                throw new Error(`Course "${course.code}" with ${course.students} students incorrectly assigned to RED room`);
              }
            }
          }
        }

        // Verify all courses are scheduled
        const scheduledCount = seenCourses.size;
        if (scheduledCount !== dbCourses.length) {
          throw new Error(`Not all courses scheduled. Expected ${dbCourses.length}, but got ${scheduledCount}`);
        }

        break; // Success!
      } catch (err: unknown) {
        console.warn(`\n❌ Attempt ${attempt} failed`);
        
        // Type guard for better error handling
        const error = err instanceof Error ? err : new Error(String(err));
        
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);
        
        if (error instanceof SyntaxError) {
          console.log('JSON Parse Error - Invalid JSON format');
        } else if (error instanceof Error) {
          console.log('Validation Error:', error.message);
        }
        
        if (attempt === 3) {
          const finalError = {
            message: "Timetable generation failed after 3 attempts",
            lastAttemptError: error.message,
            coursesCount: dbCourses.length,
            validationPhase: "Failed",
            debug: {
              errorType: error.constructor.name,
              fullError: error.toString()
            }
          };
          console.error('\nFinal error details:', JSON.stringify(finalError, null, 2));
          throw new Error(JSON.stringify(finalError));
        }
      }
    }

    if (!validated) {
      throw new Error("No valid timetable was generated.");
    }

    return NextResponse.json(validated.sessions, { status: 200 });
  } catch (error) {
    console.error("Timetable generation error:", error);
    
    let errorMessage = "Timetable generation failed";
    let errorDetails = String(error);
    
    if (error instanceof Error) {
      console.log({
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: errorDetails
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}