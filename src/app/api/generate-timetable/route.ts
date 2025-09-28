import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";
import { generatePhase1Prompt, generatePhase2Prompt, generateSchedulingInfo } from "./prompts";
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
      temperature: 0.1,
      max_tokens: 3000,
    });
    
    console.log('Phase 1 Response:', completion1.choices[0]?.message?.content);

    const planningResponse = completion1.choices[0]?.message?.content;
    if (!planningResponse || !planningResponse.includes("PHASE 2 READY")) {
      throw new Error("Planning phase did not complete as expected.");
    }

    let validated: ValidatedTimetable | undefined;

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`\n=== Attempt ${attempt} ===`);
      
      const completion2 = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
        messages: [
          { 
            role: "system", 
            content: "You are a timetable generation expert. Generate a valid JSON timetable following the provided rules exactly." 
          },
          {
            role: "assistant",
            content: planningResponse
          },
          { 
            role: "user", 
            content: generatePhase2Prompt(dbCourses, sessionsMeta)
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      });
      
      const content = completion2.choices[0]?.message?.content;
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