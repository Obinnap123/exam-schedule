import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";
import {
  generatePureAITimetablePrompt,
  generateRefinementPrompt,
} from "./ai-prompts";
import type { z } from "zod";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

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

// Pure AI timetable validation helper
function validateAITimetable(timetable: any, expectedCourses: any[]) {
  const issues: string[] = [];
  
  // Check if all courses are scheduled
  const scheduledCourses = new Set<string>();
  for (const session of timetable.sessions || []) {
    for (const course of session.red?.courses || []) {
      scheduledCourses.add(course.code);
    }
    for (const course of session.blue?.courses || []) {
      scheduledCourses.add(course.code);
    }
  }
  
  const expectedCourseCodes = new Set(expectedCourses.map(c => c.code));
  for (const code of Array.from(expectedCourseCodes)) {
    if (!scheduledCourses.has(code)) {
      issues.push(`Course ${code} is not scheduled`);
    }
  }
  
  // Check for duplicates
  const allScheduledCourses: string[] = [];
  for (const session of timetable.sessions || []) {
    for (const course of session.red?.courses || []) {
      allScheduledCourses.push(course.code);
    }
    for (const course of session.blue?.courses || []) {
      allScheduledCourses.push(course.code);
    }
  }
  
  const duplicates = allScheduledCourses.filter((code, index) => 
    allScheduledCourses.indexOf(code) !== index
  );
  
  if (duplicates.length > 0) {
    issues.push(`Duplicate course assignments: ${duplicates.join(', ')}`);
  }
  
  // Check room capacities
  for (const session of timetable.sessions || []) {
    const redTotal = session.red?.courses?.reduce((sum: number, c: any) => sum + (c.students || 0), 0) || 0;
    const blueTotal = session.blue?.courses?.reduce((sum: number, c: any) => sum + (c.students || 0), 0) || 0;
    
    if (redTotal > 96) {
      issues.push(`RED room in ${session.session} exceeds capacity: ${redTotal}/96`);
    }
    
    if (blueTotal > 192) {
      issues.push(`BLUE room in ${session.session} exceeds capacity: ${blueTotal}/192`);
    }
  }
  
  return issues;
}


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
          error:
            "No courses found in database. Please upload course data first.",
        },
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
          {
            session: `Week ${week + 1} ${dayNames[day]} Morning`,
            date: dateString,
          },
          {
            session: `Week ${week + 1} ${dayNames[day]} Afternoon`,
            date: dateString,
          }
        );
      }
    }

    console.log(`Generating timetable for ${dbCourses.length} courses across ${totalSessions} sessions using pure AI`);

    // Pure AI approach - no chunking, no backend correction
    const aiPrompt = generatePureAITimetablePrompt(dbCourses, sessionsMeta);
    
    const messages = [
      {
        role: "system",
        content: "You are an expert academic timetable generator. Generate perfect timetables that satisfy all constraints without any backend correction. Your output will be used directly.",
      },
      {
        role: "user",
        content: aiPrompt,
      },
    ] as ChatCompletionCreateParamsNonStreaming["messages"];

    let finalTimetable = null;
    let lastAttempt = "";
    let lastIssues: string[] = [];

    // Try up to 3 attempts with refinement
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`AI attempt ${attempt}/3`);
        
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: attempt === 1 ? messages : [
            {
              role: "system",
              content: "You are an expert academic timetable generator. Generate perfect timetables that satisfy all constraints without any backend correction. Your output will be used directly.",
            },
            {
              role: "user",
              content: generateRefinementPrompt(dbCourses, sessionsMeta, lastAttempt, lastIssues),
            },
          ] as ChatCompletionCreateParamsNonStreaming["messages"],
          temperature: 0.1,
          max_tokens: 4000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          console.warn(`Attempt ${attempt}: Empty response`);
          continue;
        }

        // Extract and parse JSON
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        let jsonContent = jsonMatch ? jsonMatch[1] : content;
        jsonContent = jsonContent.trim();

        console.log(`Attempt ${attempt}: Parsing JSON (length: ${jsonContent.length})`);

        const parsed = JSON.parse(jsonContent);
        lastAttempt = jsonContent;

        // Validate the AI-generated timetable
        const validationIssues = validateAITimetable(parsed, dbCourses);
        
        if (validationIssues.length === 0) {
          // Perfect timetable generated!
          finalTimetable = parsed;
          console.log(`Perfect timetable generated on attempt ${attempt}`);
          break;
        } else {
          lastIssues = validationIssues;
          console.log(`Attempt ${attempt} validation issues:`, validationIssues);
          
          if (attempt === 3) {
            // Last attempt failed, but we'll still try to use it
            console.warn("Final attempt had issues, but proceeding with timetable");
            finalTimetable = parsed;
            break;
          }
        }
      } catch (err) {
        console.warn(`Attempt ${attempt} failed:`, err);
        if (attempt === 3) {
          throw new Error(`All AI attempts failed. Last error: ${err}`);
        }
      }
    }

    if (!finalTimetable) {
      throw new Error("Failed to generate timetable after all attempts");
    }

    // Validate with schema
    const validated = timetableSchema.parse(finalTimetable);
    
    console.log("Pure AI timetable generation completed successfully");
    return NextResponse.json(validated.sessions, { status: 200 });
  } catch (error) {
    console.error("Pure AI timetable generation error:", error);

    let errorMessage = "Timetable generation failed";
    let errorDetails = String(error);

    if (error instanceof Error) {
      console.log({
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
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
