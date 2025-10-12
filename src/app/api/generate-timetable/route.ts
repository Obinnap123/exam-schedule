import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";
import {
  generatePhase1Prompt,
  generatePhase2Prompt,
  generateSchedulingInfo,
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

// Helper function to check if courses can be paired
const canBePaired = (course1: any, course2: any, roomCapacity: number) => {
  return course1.students + course2.students <= roomCapacity;
};

// Helper to auto-correct AI timetable to satisfy capacities and constraints
function autoCorrectTimetable(
  raw: any,
  dbCourses: { code: string; students: number; department?: string }[]
) {
  const RED_CAP = 96;
  const BLUE_CAP = 192;

  const codeToMeta = new Map<
    string,
    { students: number; department?: string }
  >();
  for (const c of dbCourses)
    codeToMeta.set(c.code, { students: c.students, department: c.department });

  // Deep clone sessions to avoid mutating original object
  const sessions = (raw.sessions || []).map((s: any) => ({
    session: s.session,
    date: s.date,
    red: { courses: [...(s.red?.courses || [])], total: 0, utilization: "0%" },
    blue: {
      courses: [...(s.blue?.courses || [])],
      total: 0,
      utilization: "0%",
    },
  }));

  const unscheduled: { code: string; students: number; department?: string }[] =
    [];

  const getDeptSetForRed = (courses: { code: string }[]) => {
    const set = new Set<string>();
    for (const c of courses) {
      const meta = codeToMeta.get(c.code);
      if (meta?.department) set.add(meta.department);
    }
    return set;
  };

  const recomputeRoom = (
    room: {
      courses: { code: string; students?: number }[];
      total: number;
      utilization: string;
    },
    cap: number
  ) => {
    // Normalize students from DB
    for (const rc of room.courses) {
      const meta = codeToMeta.get(rc.code);
      rc.students = meta?.students ?? rc.students ?? 0;
    }
    room.total = room.courses.reduce((sum, c) => sum + (c.students || 0), 0);
    room.utilization = calculateUtilization(room.total, cap);
  };

  // First pass: recompute totals, eject overflow courses to unscheduled
  for (const s of sessions) {
    recomputeRoom(s.red, RED_CAP);
    recomputeRoom(s.blue, BLUE_CAP);

    // Red seat can have any courses as long as total ≤ 96 (no department restriction)

    // If red over capacity, try move smallest from red to blue if blue can take
    if (s.red.total > RED_CAP) {
      // sort ascending by students
      s.red.courses.sort(
        (a: { students?: number }, b: { students?: number }) =>
          (a.students || 0) - (b.students || 0)
      );
      while (s.red.total > RED_CAP && s.red.courses.length > 0) {
        const candidate = s.red.courses.shift()!;
        const newBlueTotal = s.blue.total + (candidate.students || 0);
        if (newBlueTotal <= BLUE_CAP) {
          s.blue.courses.push(candidate);
          recomputeRoom(s.blue, BLUE_CAP);
        } else {
          unscheduled.push({
            code: candidate.code,
            students: candidate.students || 0,
            department: codeToMeta.get(candidate.code)?.department,
          });
        }
        recomputeRoom(s.red, RED_CAP);
      }
    }

    // If blue over capacity, move smallest to unscheduled (we'll place later)
    if (s.blue.total > BLUE_CAP) {
      s.blue.courses.sort(
        (a: { students?: number }, b: { students?: number }) =>
          (a.students || 0) - (b.students || 0)
      );
      while (s.blue.total > BLUE_CAP && s.blue.courses.length > 0) {
        const moved = s.blue.courses.shift()!;
        unscheduled.push({
          code: moved.code,
          students: moved.students || 0,
          department: codeToMeta.get(moved.code)?.department,
        });
        recomputeRoom(s.blue, BLUE_CAP);
      }
    }
  }

  // Build sets to avoid duplicates
  const scheduledCodes = new Set<string>();
  for (const s of sessions) {
    for (const c of s.red.courses) scheduledCodes.add(c.code);
    for (const c of s.blue.courses) scheduledCodes.add(c.code);
  }
  // Add any missing DB courses into unscheduled
  for (const dc of dbCourses) {
    if (!scheduledCodes.has(dc.code))
      unscheduled.push({
        code: dc.code,
        students: dc.students,
        department: dc.department ?? undefined,
      });
  }

  // Greedy placement for unscheduled into existing sessions
  const tryPlace = (course: {
    code: string;
    students: number;
    department?: string;
  }) => {
    // Try red first (any department allowed)
    for (const s of sessions) {
      if (s.red.total + course.students <= RED_CAP) {
        s.red.courses.push({ code: course.code, students: course.students });
        recomputeRoom(s.red, RED_CAP);
        return true;
      }
    }
    // Try blue as fallback
    for (const s of sessions) {
      if (s.blue.total + course.students <= BLUE_CAP) {
        s.blue.courses.push({ code: course.code, students: course.students });
        recomputeRoom(s.blue, BLUE_CAP);
        return true;
      }
    }
    return false;
  };

  // Place unscheduled, largest first to reduce risk of overflows later
  unscheduled.sort(
    (a: { students: number }, b: { students: number }) =>
      b.students - a.students
  );
  const stillUnplaced: typeof unscheduled = [];
  for (const c of unscheduled) {
    if (!tryPlace(c)) stillUnplaced.push(c);
  }

  if (stillUnplaced.length > 0) {
    const list = stillUnplaced
      .map((c) => `${c.code}(${c.students})`)
      .join(", ");
    throw new Error(`Unable to place some courses within capacities: ${list}`);
  }

  // Final recompute of totals and utilization
  for (const s of sessions) {
    recomputeRoom(s.red, RED_CAP);
    recomputeRoom(s.blue, BLUE_CAP);
    
    // CRITICAL: Final capacity validation - MUST NEVER EXCEED
    if (s.red.total > RED_CAP) {
      throw new Error(`CAPACITY VIOLATION: RED room in ${s.session} has ${s.red.total} students (max 96). Courses: ${s.red.courses.map((c: any) => `${c.code}(${c.students})`).join(', ')}`);
    }
    if (s.blue.total > BLUE_CAP) {
      throw new Error(`CAPACITY VIOLATION: BLUE room in ${s.session} has ${s.blue.total} students (max 192). Courses: ${s.blue.courses.map((c: any) => `${c.code}(${c.students})`).join(', ')}`);
    }
  }

  return { sessions };
}

// Combine multiple timetables into one master timetable
function combineTimetables(timetables: any[], sessionsMeta: any[]) {
  const RED_CAP = 96;
  const BLUE_CAP = 192;
  
  // Create empty sessions for all available time slots
  const masterSessions = sessionsMeta.map(meta => ({
    session: meta.session,
    date: meta.date,
    red: { courses: [], total: 0, utilization: "0%" },
    blue: { courses: [], total: 0, utilization: "0%" }
  }));
  
  // Track which courses are already placed
  const placedCourses = new Set<string>();
  
  // Helper to update room totals
  const updateRoomTotals = (room: any, cap: number) => {
    room.total = room.courses.reduce((sum: number, c: any) => sum + (c.students || 0), 0);
    room.utilization = calculateUtilization(room.total, cap);
  };
  
  // Process each timetable and merge courses into master sessions
  for (const timetable of timetables) {
    for (const session of timetable.sessions || []) {
      // Find matching master session
      const masterSession = masterSessions.find(ms => ms.session === session.session);
      if (!masterSession) continue;
      
      // Add red room courses
      for (const course of session.red.courses || []) {
        if (placedCourses.has(course.code)) continue; // Skip duplicates
        
        // Check if course fits in red room
        if (course.students <= 96 && masterSession.red.total + course.students <= RED_CAP) {
          (masterSession.red.courses as any[]).push(course);
          updateRoomTotals(masterSession.red, RED_CAP);
          placedCourses.add(course.code);
        } else if (masterSession.blue.total + course.students <= BLUE_CAP) {
          // Try blue room if red doesn't fit
          (masterSession.blue.courses as any[]).push(course);
          updateRoomTotals(masterSession.blue, BLUE_CAP);
          placedCourses.add(course.code);
        }
      }
      
      // Add blue room courses
      for (const course of session.blue.courses || []) {
        if (placedCourses.has(course.code)) continue; // Skip duplicates
        
        if (masterSession.blue.total + course.students <= BLUE_CAP) {
          (masterSession.blue.courses as any[]).push(course);
          updateRoomTotals(masterSession.blue, BLUE_CAP);
          placedCourses.add(course.code);
        }
      }
    }
  }
  
  return { sessions: masterSessions };
}

// Create a simple fallback timetable for a chunk when AI fails
function createSimpleChunkTimetable(chunk: any[], sessionsMeta: any[]) {
  const RED_CAP = 96;
  const BLUE_CAP = 192;
  const sessions: any[] = [];
  
  // Sort courses by size (largest first)
  const sortedCourses = [...chunk].sort((a, b) => b.students - a.students);
  
  let courseIndex = 0;
  let sessionIndex = 0;
  
  while (courseIndex < sortedCourses.length && sessionIndex < sessionsMeta.length) {
    const sessionMeta = sessionsMeta[sessionIndex];
    const session = {
      session: sessionMeta.session,
      date: sessionMeta.date,
      red: { courses: [], total: 0, utilization: "0%" },
      blue: { courses: [], total: 0, utilization: "0%" }
    };
    
    // Fill RED room first (courses ≤ 96 students)
    while (courseIndex < sortedCourses.length && 
           sortedCourses[courseIndex].students <= 96 && 
           session.red.total + sortedCourses[courseIndex].students <= RED_CAP) {
      const course = sortedCourses[courseIndex];
      (session.red.courses as any[]).push({ code: course.code, students: course.students });
      session.red.total += course.students;
      courseIndex++;
    }
    
    // Fill BLUE room (any remaining courses that fit)
    while (courseIndex < sortedCourses.length && 
           session.blue.total + sortedCourses[courseIndex].students <= BLUE_CAP) {
      const course = sortedCourses[courseIndex];
      (session.blue.courses as any[]).push({ code: course.code, students: course.students });
      session.blue.total += course.students;
      courseIndex++;
    }
    
    // Update utilization
    session.red.utilization = calculateUtilization(session.red.total, RED_CAP);
    session.blue.utilization = calculateUtilization(session.blue.total, BLUE_CAP);
    
    sessions.push(session);
    sessionIndex++;
  }
  
  return { sessions };
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

    const sessionDetails = sessionsMeta
      .map((s) => `- ${s.session} (${s.date})`)
      .join("\n");

    // BATCHING APPROACH: Split courses into manageable chunks
    const CHUNK_SIZE = 15; // Process 15 courses at a time (smaller for better reliability)
    const courseChunks = [];
    
    for (let i = 0; i < dbCourses.length; i += CHUNK_SIZE) {
      courseChunks.push(dbCourses.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`Processing ${dbCourses.length} courses in ${courseChunks.length} chunks of ${CHUNK_SIZE} each`);

    const allTimetables = [];
    
    // Process each chunk with AI
    for (let chunkIndex = 0; chunkIndex < courseChunks.length; chunkIndex++) {
      const chunk = courseChunks[chunkIndex];
      console.log(`Processing chunk ${chunkIndex + 1}/${courseChunks.length} with ${chunk.length} courses`);
      
      const chunkPhase1Prompt = generatePhase1Prompt(chunk, totalSessions, sessionDetails);
      const chunkSchedulingInfo = generateSchedulingInfo(chunk, totalSessions);
      
      const chunkMessages = [
        {
          role: "system",
          content: "You are an expert academic scheduling system. Your task is to create efficient exam timetables that maximize room usage and follow all constraints.",
        },
        {
          role: "user",
          content: chunkPhase1Prompt + chunkSchedulingInfo,
        },
      ] as ChatCompletionCreateParamsNonStreaming["messages"];
      
      const completion1 = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
        messages: chunkMessages,
        temperature: 0.1,
        max_tokens: 2000, // Smaller max_tokens for smaller chunks
      });
      
      const planningResponse = completion1.choices[0]?.message?.content;
      if (!planningResponse || !planningResponse.includes("PHASE 2 READY")) {
        throw new Error(`Planning phase failed for chunk ${chunkIndex + 1}`);
      }

      // Generate timetable for this chunk
      let chunkTimetable = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const phase2Messages = [
            {
              role: "system",
              content: "You are a timetable generation expert. Generate a valid JSON timetable following the provided rules exactly.",
            },
            {
              role: "assistant",
              content: planningResponse,
            },
            {
              role: "user",
              content: generatePhase2Prompt(chunk, sessionsMeta),
            },
          ] as ChatCompletionCreateParamsNonStreaming["messages"];
          
          const completion2 = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
            messages: phase2Messages,
            temperature: 0.1,
            max_tokens: 2000,
          });
          
          const content = completion2.choices[0]?.message?.content;
          if (!content) {
            console.warn(`Chunk ${chunkIndex + 1} attempt ${attempt}: Empty response`);
            continue;
          }
          
          // Extract and parse JSON
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          let jsonContent = jsonMatch ? jsonMatch[1] : content;
          jsonContent = jsonContent.trim();
          
          console.log(`Chunk ${chunkIndex + 1} attempt ${attempt}: Trying to parse JSON (length: ${jsonContent.length})`);
          
          const parsed = JSON.parse(jsonContent);
          const corrected = autoCorrectTimetable(parsed, chunk.map(c => ({
            code: c.code,
            students: c.students,
            department: c.department ?? undefined
          })));
          
          chunkTimetable = corrected;
          break; // Success!
        } catch (err) {
          console.warn(`Chunk ${chunkIndex + 1} attempt ${attempt} failed:`, err);
          if (attempt === 3) {
            console.error(`Chunk ${chunkIndex + 1} failed completely, creating fallback timetable for this chunk`);
            // Create a simple fallback timetable for this chunk
            chunkTimetable = createSimpleChunkTimetable(chunk, sessionsMeta);
            break;
          }
        }
      }
      
      if (!chunkTimetable) {
        throw new Error(`No valid timetable generated for chunk ${chunkIndex + 1}`);
      }
      
      allTimetables.push(chunkTimetable);
    }
    
    // Combine all chunk timetables into one master timetable
    const masterTimetable = combineTimetables(allTimetables, sessionsMeta);
    
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
