import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";
import {
  generatePhase2Prompt,
  generateProgressivePrompt,
} from "./prompts";
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

// Helper function to calculate utilization percentage
const calculateUtilization = (total: number, capacity: number) => {
  return `${((total / capacity) * 100).toFixed(1)}%`;
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
        {
          error:
            "No courses found in database. Please upload course data first.",
        },
        { status: 400 }
      );
    }
    
    // Sort courses: LARGEST FIRST (helps with placement)
    dbCourses.sort((a, b) => b.students - a.students);
    
    const largeCourseCount = dbCourses.filter(c => c.students > 96).length;
    const mediumCourseCount = dbCourses.filter(c => c.students >= 65 && c.students <= 96).length;
    const smallCourseCount = dbCourses.filter(c => c.students < 65).length;
    
    console.log('\n📊 Total courses to schedule:', dbCourses.length);
    console.log(`   Large (>96): ${largeCourseCount} courses`);
    console.log(`   Medium (65-96): ${mediumCourseCount} courses`);
    console.log(`   Small (<65): ${smallCourseCount} courses`);
    console.log(`   Largest: ${dbCourses[0].code}(${dbCourses[0].students})`);
    console.log(`   Smallest: ${dbCourses[dbCourses.length-1].code}(${dbCourses[dbCourses.length-1].students})`);

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

    // PROGRESSIVE AI BUILDING: Split into chunks of 5 (smaller = easier for AI)
    const CHUNK_SIZE = 5;
    const courseChunks = [];
    
    for (let i = 0; i < dbCourses.length; i += CHUNK_SIZE) {
      courseChunks.push(dbCourses.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`\n🚀 PROGRESSIVE AI TIMETABLE GENERATION`);
    console.log(`Processing ${dbCourses.length} courses in ${courseChunks.length} chunks of ${CHUNK_SIZE} courses each`);
    console.log(`Strategy: Small chunks (5 courses) with explicit placement instructions\n`);

    // Initialize master timetable with empty sessions
    let masterTimetable = {
      sessions: sessionsMeta.map(meta => ({
        session: meta.session,
        date: meta.date,
        red: { courses: [], total: 0, utilization: "0%" },
        blue: { courses: [], total: 0, utilization: "0%" }
      }))
    };
    
    // Process each chunk progressively - AI builds on previous results
    for (let chunkIndex = 0; chunkIndex < courseChunks.length; chunkIndex++) {
      const chunk = courseChunks[chunkIndex];
      const isFirstChunk = chunkIndex === 0;
      
      const largeInChunk = chunk.filter(c => c.students > 96).length;
      const mediumInChunk = chunk.filter(c => c.students >= 65 && c.students <= 96).length;
      const smallInChunk = chunk.filter(c => c.students < 65).length;
      
      console.log(`\n📦 Chunk ${chunkIndex + 1}/${courseChunks.length}: Adding ${chunk.length} courses`);
      console.log(`   Large: ${largeInChunk}, Medium: ${mediumInChunk}, Small: ${smallInChunk}`);
      console.log(`   Courses: ${chunk.map(c => `${c.code}(${c.students})`).join(', ')}`);
      
      // Generate timetable for this chunk
      let updatedTimetable = null;
      const attemptErrors: string[] = []; // Track what went wrong in each attempt
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Generate prompt based on whether this is first chunk or building on existing
          let promptContent;
          if (isFirstChunk) {
            // First chunk: Start fresh with empty timetable
            promptContent = generatePhase2Prompt(chunk, sessionsMeta);
          } else {
            // Subsequent chunks: Build on existing timetable
            promptContent = generateProgressivePrompt(
              chunk,
              masterTimetable,
              sessionsMeta,
              chunkIndex + 1,
              courseChunks.length
            );
          }
          
          const messages = [
            {
              role: "system",
              content: `You are an expert exam timetable scheduler. Generate valid JSON timetables following all capacity and scheduling rules.

CRITICAL RULES:
1. RED room max = 96 students. NEVER place any single course with >96 students in RED room.
2. BLUE room max = 192 students. Large courses (>96 students) MUST be ALONE in BLUE room.
3. Before placing a course, check its size:
   - If course > 96 students → ONLY BLUE room, ALONE
   - If course ≤ 96 students → Try RED first, then BLUE
4. ALWAYS return valid JSON. No text, no markdown, just JSON.`,
            },
            {
              role: "user",
              content: promptContent,
            },
          ] as ChatCompletionCreateParamsNonStreaming["messages"];
          
          const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
            messages: messages,
            temperature: 0.1, // Low temperature for consistent, rule-following behavior
            max_tokens: 4096, // Maximum allowed for this model
          });
          
          const content = completion.choices[0]?.message?.content;
          if (!content) {
            const error = `Empty response from AI`;
            console.warn(`   ⚠️  Attempt ${attempt}: ${error}`);
            attemptErrors.push(`Attempt ${attempt}: ${error}`);
            continue;
          }
          
          // Extract and parse JSON
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          let jsonContent = jsonMatch ? jsonMatch[1] : content;
          jsonContent = jsonContent.trim();
          
          // Check if AI returned text instead of JSON
          if (jsonContent.startsWith('#') || jsonContent.startsWith('PHASE') || jsonContent.includes('### Plan')) {
            const error = `AI returned text/markdown instead of JSON (starts with: ${jsonContent.substring(0, 50)}...)`;
            console.warn(`   ⚠️  Attempt ${attempt}: ${error}`);
            attemptErrors.push(`Attempt ${attempt}: ${error}`);
            continue;
          }
          
          console.log(`   🔍 Attempt ${attempt}: Parsing JSON (${jsonContent.length} chars)`);
          
          const parsed = JSON.parse(jsonContent);
          
          // Basic validation: Check capacities
          let capacityViolation = false;
          let violationDetails = '';
          for (const session of parsed.sessions || []) {
            const redCourses = session.red?.courses || [];
            const blueCourses = session.blue?.courses || [];
            
            // CRITICAL: Check if any RED course is >96 students (individual course check)
            for (const course of redCourses) {
              if (course.students > 96) {
                violationDetails = `Course ${course.code} with ${course.students} students placed in RED room (max 96 per course). This course MUST be in BLUE room alone.`;
                console.warn(`   ⚠️  Attempt ${attempt}: ${violationDetails}`);
                attemptErrors.push(`Attempt ${attempt}: ${violationDetails}`);
                capacityViolation = true;
                break;
              }
            }
            if (capacityViolation) break;
            
            const redTotal = redCourses.reduce((sum: number, c: any) => sum + (c.students || 0), 0);
            const blueTotal = blueCourses.reduce((sum: number, c: any) => sum + (c.students || 0), 0);
            
            if (redTotal > 96) {
              violationDetails = `RED room total capacity exceeded in ${session.session}: ${redTotal}/96 (courses: ${redCourses.map((c: any) => `${c.code}(${c.students})`).join(', ')})`;
              console.warn(`   ⚠️  Attempt ${attempt}: ${violationDetails}`);
              attemptErrors.push(`Attempt ${attempt}: ${violationDetails}`);
              capacityViolation = true;
              break;
            }
            if (blueTotal > 192) {
              violationDetails = `BLUE room capacity exceeded in ${session.session}: ${blueTotal}/192`;
              console.warn(`   ⚠️  Attempt ${attempt}: ${violationDetails}`);
              attemptErrors.push(`Attempt ${attempt}: ${violationDetails}`);
              capacityViolation = true;
              break;
            }
            
            // Check large course alone rule
            if (blueCourses.length > 1) {
              const hasLarge = blueCourses.some((c: any) => c.students > 96);
              if (hasLarge) {
                violationDetails = `Large course not alone in BLUE room in ${session.session}`;
                console.warn(`   ⚠️  Attempt ${attempt}: ${violationDetails}`);
                attemptErrors.push(`Attempt ${attempt}: ${violationDetails}`);
                capacityViolation = true;
                break;
              }
            }
          }
          
          if (capacityViolation) {
            console.warn(`   ⚠️  Attempt ${attempt}: Capacity violation detected. Retrying...`);
            continue;
          }
          
          // Check if expected courses from current and previous chunks are present
          const expectedCourses = new Set<string>();
          for (let i = 0; i <= chunkIndex; i++) {
            for (const course of courseChunks[i]) {
              expectedCourses.add(course.code);
            }
          }
          
          const scheduledCourses = new Set<string>();
          for (const session of parsed.sessions || []) {
            for (const course of (session.red?.courses || [])) {
              scheduledCourses.add(course.code);
            }
            for (const course of (session.blue?.courses || [])) {
              scheduledCourses.add(course.code);
            }
          }
          
          const missingCourses = Array.from(expectedCourses).filter(code => !scheduledCourses.has(code));
          if (missingCourses.length > 0) {
            const error = `Missing ${missingCourses.length} courses: ${missingCourses.slice(0, 10).join(', ')}${missingCourses.length > 10 ? '...' : ''}`;
            console.warn(`   ⚠️  Attempt ${attempt}: ${error}`);
            attemptErrors.push(`Attempt ${attempt}: ${error}`);
            if (attempt < 3) {
              console.warn(`   🔄  Retrying with stronger emphasis on including ALL courses...`);
            }
            continue;
          }
          
          // Check for duplicate courses
          const allScheduledCodesArray: string[] = [];
          for (const session of parsed.sessions || []) {
            for (const course of (session.red?.courses || [])) {
              allScheduledCodesArray.push(course.code);
            }
            for (const course of (session.blue?.courses || [])) {
              allScheduledCodesArray.push(course.code);
            }
          }
          const duplicates = allScheduledCodesArray.filter((code, index) => 
            allScheduledCodesArray.indexOf(code) !== index
          );
          if (duplicates.length > 0) {
            const error = `Found duplicate courses: ${[...new Set(duplicates)].slice(0, 5).join(', ')}`;
            console.warn(`   ⚠️  Attempt ${attempt}: ${error}`);
            attemptErrors.push(`Attempt ${attempt}: ${error}`);
            continue;
          }
          
          updatedTimetable = parsed;
          console.log(`   ✅ Successfully processed chunk ${chunkIndex + 1}`);
          console.log(`   📊 Courses scheduled: ${scheduledCourses.size}/${dbCourses.length}`);
          break; // Success!
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.warn(`   ❌ Attempt ${attempt} failed:`, errorMsg);
          attemptErrors.push(`Attempt ${attempt}: Exception - ${errorMsg}`);
          if (attempt === 3) {
            const detailedError = `Chunk ${chunkIndex + 1} failed after 3 attempts. Details:\n${attemptErrors.join('\n')}`;
            throw new Error(detailedError);
          }
        }
      }
      
      if (!updatedTimetable) {
        const detailedError = `No valid timetable generated for chunk ${chunkIndex + 1}. Errors:\n${attemptErrors.join('\n')}`;
        throw new Error(detailedError);
      }
      
      // Update master timetable with this chunk's result
      masterTimetable = updatedTimetable;
    }
    
    console.log(`\n✨ Progressive generation complete!`);
    
    // Final validation: Check ALL courses are scheduled
    const allScheduledCourses = new Set<string>();
    for (const session of masterTimetable.sessions) {
      for (const course of (session.red?.courses || [])) {
        allScheduledCourses.add((course as any).code);
      }
      for (const course of (session.blue?.courses || [])) {
        allScheduledCourses.add((course as any).code);
      }
    }
    
    const allExpectedCourses = new Set(dbCourses.map(c => c.code));
    const finalMissing = Array.from(allExpectedCourses).filter(code => !allScheduledCourses.has(code));
    
    if (finalMissing.length > 0) {
      console.error(`\n❌ FINAL VALIDATION FAILED: ${finalMissing.length} courses not scheduled:`);
      console.error(`   Missing: ${finalMissing.join(', ')}`);
      throw new Error(`Final timetable is missing ${finalMissing.length} courses: ${finalMissing.slice(0, 10).join(', ')}${finalMissing.length > 10 ? '...' : ''}`);
    }
    
    console.log(`\n✅ FINAL VALIDATION PASSED: All ${dbCourses.length} courses scheduled!`);
    
    // Log final statistics
    let totalRedUsage = 0;
    let totalBlueUsage = 0;
    let sessionsWithBothRooms = 0;
    
    for (const session of masterTimetable.sessions) {
      const redCount = session.red?.courses?.length || 0;
      const blueCount = session.blue?.courses?.length || 0;
      totalRedUsage += redCount;
      totalBlueUsage += blueCount;
      if (redCount > 0 && blueCount > 0) sessionsWithBothRooms++;
    }
    
    console.log(`\n📊 FINAL STATISTICS:`);
    console.log(`   Total sessions: ${sessionsMeta.length}`);
    console.log(`   Sessions used: ${masterTimetable.sessions.filter((s: any) => (s.red.courses.length + s.blue.courses.length) > 0).length}`);
    console.log(`   RED room usage: ${totalRedUsage} course slots`);
    console.log(`   BLUE room usage: ${totalBlueUsage} course slots`);
    console.log(`   Sessions using both rooms: ${sessionsWithBothRooms}`);
    
    // Validate the final combined timetable
    const validated = timetableSchema.parse(masterTimetable);
    
    return NextResponse.json(validated.sessions, { status: 200 });
  } catch (error) {
    console.error("Timetable generation error:", error);

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
