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

    const phase1Prompt = generatePhase1Prompt(
      dbCourses,
      totalSessions,
      sessionDetails
    );
    const schedulingInfo = generateSchedulingInfo(dbCourses, totalSessions);

    // console.log('Starting timetable generation...');
    // console.log('Total courses to schedule:', dbCourses.length);

    const messages = [
      {
        role: "system",
        content:
          "You are an expert academic scheduling system. Your task is to create efficient exam timetables that maximize room usage and follow all constraints.",
      },
      {
        role: "user",
        content: phase1Prompt + schedulingInfo,
      },
    ] as ChatCompletionCreateParamsNonStreaming["messages"];
    // console.log('Phase 1 Messages:', messages);

    const completion1 = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
      messages,
      temperature: 0.1,
      max_tokens: 3000,
    });

    // console.log('Phase 1 Response:', completion1.choices[0]?.message?.content);

    const planningResponse = completion1.choices[0]?.message?.content;
    if (!planningResponse || !planningResponse.includes("PHASE 2 READY")) {
      throw new Error("Planning phase did not complete as expected.");
    }

    let validated: ValidatedTimetable | undefined;
    let correctionNote = "";
    let previousJsonForFix = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
      // console.log(`\n=== Attempt ${attempt} ===`);

      const phase2Messages = [
        {
          role: "system",
          content:
            "You are a timetable generation expert. Generate a valid JSON timetable following the provided rules exactly. Compute totals as the sum of listed course students and ensure utilization values match those totals and capacities (RED 96, BLUE 192).",
        },
        {
          role: "assistant",
          content: planningResponse,
        },
        {
          role: "user",
          content: generatePhase2Prompt(dbCourses, sessionsMeta),
        },
        ...(correctionNote
          ? [
              {
                role: "user" as const,
                content: `IMPORTANT: The previous attempt failed validation: ${correctionNote}\n\nHere is the last JSON you produced. Fix ONLY the allocations that violate the rules; keep all courses and student counts unchanged. Ensure every course appears exactly once. Output ONLY the corrected JSON (no extra text).\n\n--- BEGIN PREVIOUS JSON ---\n${previousJsonForFix}\n--- END PREVIOUS JSON ---`,
              },
            ]
          : []),
      ] as ChatCompletionCreateParamsNonStreaming["messages"];

      console.log(phase2Messages);

      const completion2 = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-0125",
        messages: phase2Messages,
        temperature: 0.1,
        max_tokens: 3000,
      });

      const content = completion2.choices[0]?.message?.content;
      if (!content) {
        console.warn(`Attempt ${attempt}: Empty GPT response.`);
        continue;
      }

      // console.log(`🔍 GPT Raw Output (Attempt ${attempt}):\n`, content);

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
        // console.log('\nSuccessfully parsed JSON:', JSON.stringify(parsed, null, 2));

        // Auto-correct capacities and constraints before validation
        const corrected = autoCorrectTimetable(
          parsed,
          dbCourses.map((c) => ({
            code: c.code,
            students: c.students,
            department: c.department ?? undefined,
          }))
        );

        validated = timetableSchema.parse(corrected);
        // console.log(`Attempt ${attempt} - Schema validation passed`);

        const seenCourses = new Set<string>();
        const seenDepartments = new Map<string, Set<string>>(); // Track departments by day

        for (const session of validated.sessions) {
          // Validate room capacities
          if (session.red.total > 96)
            throw new Error(
              `Red seat overflow in ${session.session}: ${session.red.total} students`
            );
          if (session.blue.total > 192)
            throw new Error(
              `Blue seat overflow in ${session.session}: ${session.blue.total} students`
            );

          // Extract day from session (e.g., "Week 1 Monday Morning" -> "Monday")
          const day = session.session.split(" ")[2];

          for (const color of ["red", "blue"] as const) {
            for (const course of session[color].courses) {
              // Check for duplicate courses
              if (seenCourses.has(course.code)) {
                throw new Error(
                  `Course "${course.code}" appears in multiple sessions.`
                );
              }
              seenCourses.add(course.code);

              // Track department distribution
              const dept = dbCourses.find(
                (c) => c.code === course.code
              )?.department;
              if (dept) {
                if (!seenDepartments.has(day)) {
                  seenDepartments.set(day, new Set());
                }
                seenDepartments.get(day)!.add(dept);
              }

              // Validate course size constraints
              if (color === "red" && course.students > 96) {
                throw new Error(
                  `Course "${course.code}" with ${course.students} students incorrectly assigned to RED room`
                );
              }
            }
          }
        }

        // Verify all courses are scheduled
        const scheduledCount = seenCourses.size;
        if (scheduledCount !== dbCourses.length) {
          throw new Error(
            `Not all courses scheduled. Expected ${dbCourses.length}, but got ${scheduledCount}`
          );
        }

        break; // Success!
      } catch (err: unknown) {
        console.warn(`\n❌ Attempt ${attempt} failed`);

        // Type guard for better error handling
        const error = err instanceof Error ? err : new Error(String(err));

        // console.log('Error type:', error.constructor.name);
        // console.log('Error message:', error.message);

        if (error instanceof SyntaxError) {
          // console.log('JSON Parse Error - Invalid JSON format');
        } else if (error instanceof Error) {
          // console.log('Validation Error:', error.message);
        }

        if (attempt === 3) {
          const finalError = {
            message: "Timetable generation failed after 3 attempts",
            lastAttemptError: error.message,
            coursesCount: dbCourses.length,
            validationPhase: "Failed",
            debug: {
              errorType: error.constructor.name,
              fullError: error.toString(),
            },
          };
          console.error(
            "\nFinal error details:",
            JSON.stringify(finalError, null, 2)
          );
          throw new Error(JSON.stringify(finalError));
        }

        // Pass the validator feedback and the prior JSON into the next attempt
        correctionNote = error.message;
        if (typeof jsonContent === "string" && jsonContent.length > 0) {
          // Keep a compact copy to stay within context limits
          previousJsonForFix = jsonContent;
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
