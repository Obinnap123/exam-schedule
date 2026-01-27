import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";

const prisma = new PrismaClient();

// Domain Models
interface Course {
  code: string;
  students: number;
  department?: string;
}

interface RoomData {
  courses: { code: string; students: number }[];
  total: number;
  utilization: string;
}

interface Session {
  session: string;
  date: string;
  red: RoomData;
  blue: RoomData;
}

// Constants
const RED_CAP = 96;
const BLUE_CAP = 192;

// Helper function to calculate utilization percentage
const calculateUtilization = (total: number, capacity: number): string => {
  return `${((total / capacity) * 100).toFixed(1)}%`;
};

// Best-fit bin packing algorithm for optimal timetable generation
function generateTimetableBestFit(
  courses: Course[],
  sessionsMeta: { session: string; date: string }[],
): Session[] {
  // Sort courses by size (largest first) for best-fit placement
  const sortedCourses = [...courses].sort((a, b) => b.students - a.students);

  // Initialize all sessions with empty rooms
  const sessions: Session[] = sessionsMeta.map((meta) => ({
    session: meta.session,
    date: meta.date,
    red: { courses: [], total: 0, utilization: "0%" },
    blue: { courses: [], total: 0, utilization: "0%" },
  }));

  // Track which courses have been placed
  const placedCourses = new Set<string>();
  const unplacedCourses: Course[] = [];

  console.log(`\n🎯 BEST-FIT BIN PACKING TIMETABLE GENERATION`);
  console.log(`Total courses: ${courses.length}`);
  console.log(`Total sessions: ${sessions.length}`);
  console.log(
    `Total capacity: ${sessions.length * (RED_CAP + BLUE_CAP)} students`,
  );
  console.log(`📦 Each course placed in room with LEAST wasted space\n`);

  // CRITICAL CHECK: Can we actually fit this?
  const largeCourses = courses.filter((c) => c.students > 96);
  if (largeCourses.length > sessions.length) {
    throw new Error(
      `Cannot fit ${largeCourses.length} large courses into ${sessions.length} sessions. Each large course needs its own BLUE room. Need at least ${Math.ceil(largeCourses.length / 10)} weeks.`,
    );
  }

  // Calculate capacity requirements
  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0);
  const totalCapacity = sessions.length * (RED_CAP + BLUE_CAP);
  const utilizationNeeded = ((totalStudents / totalCapacity) * 100).toFixed(1);

  console.log(
    `Total students: ${totalStudents}, Need ${utilizationNeeded}% utilization`,
  );

  // Helper function to find best fit for a course
  const findBestFit = (
    course: Course,
  ): { sessionIndex: number; roomType: "red" | "blue" } | null => {
    let bestFit = null;
    let minWaste = Infinity;

    sessions.forEach((session, index) => {
      // Try RED room
      if (course.students <= RED_CAP) {
        const waste = RED_CAP - (session.red.total + course.students);
        if (waste >= 0 && waste < minWaste) {
          minWaste = waste;
          bestFit = { sessionIndex: index, roomType: "red" };
        }
      }

      // Try BLUE room (if not occupied by large course and course fits)
      const hasLargeCourse = session.blue.courses.some((c) => c.students > 96);
      if (!hasLargeCourse && course.students <= BLUE_CAP) {
        const waste = BLUE_CAP - (session.blue.total + course.students);
        if (waste >= 0 && waste < minWaste) {
          minWaste = waste;
          bestFit = { sessionIndex: index, roomType: "blue" };
        }
      }

      // Special case: Large courses (>96) must go alone in BLUE
      if (course.students > 96 && session.blue.courses.length === 0) {
        const waste = BLUE_CAP - course.students;
        if (waste >= 0 && waste < minWaste) {
          minWaste = waste;
          bestFit = { sessionIndex: index, roomType: "blue" };
        }
      }
    });

    return bestFit;
  };

  // Place each course using best-fit algorithm
  for (const course of sortedCourses) {
    const bestFit = findBestFit(course);

    if (bestFit) {
      const { sessionIndex, roomType } = bestFit;
      const session = sessions[sessionIndex];
      const room = session[roomType];

      room.courses.push({ code: course.code, students: course.students });
      room.total += course.students;
      room.utilization = calculateUtilization(
        room.total,
        roomType === "red" ? RED_CAP : BLUE_CAP,
      );

      placedCourses.add(course.code);
      console.log(
        `   ✅ ${course.code}(${course.students}) → ${session.session} ${roomType.toUpperCase()} (${room.total}/${roomType === "red" ? RED_CAP : BLUE_CAP})`,
      );
    } else {
      console.warn(`   ❌ No fit found for ${course.code}(${course.students})`);
      unplacedCourses.push(course);
    }
  }

  // Final validation
  console.log(`\n📊 PLACEMENT SUMMARY:`);
  console.log(`   Placed: ${placedCourses.size}/${courses.length} courses`);
  console.log(`   Unplaced: ${unplacedCourses.length} courses`);

  if (unplacedCourses.length > 0) {
    console.error(`\n❌ UNPLACED COURSES (${unplacedCourses.length}):`);
    unplacedCourses.forEach((c) =>
      console.error(`   - ${c.code}(${c.students}) students`),
    );

    // DIAGNOSTIC: Analyze what space is actually available
    console.error(`\n🔍 DIAGNOSTIC - Analyzing available space:`);
    let totalRedUsed = 0;
    let totalBlueUsed = 0;
    let redRoomsWithSpace = 0;
    let blueRoomsWithSpace = 0;
    let blueRoomsWithLargeCourse = 0;

    sessions.forEach((s) => {
      totalRedUsed += s.red.total;
      totalBlueUsed += s.blue.total;
      if (s.red.total < RED_CAP) redRoomsWithSpace++;
      const hasLarge = s.blue.courses.some((c) => c.students > 96);
      if (hasLarge) blueRoomsWithLargeCourse++;
      if (!hasLarge && s.blue.total < BLUE_CAP) blueRoomsWithSpace++;
    });

    const totalRedCapacity = sessions.length * RED_CAP;
    const totalBlueCapacity = sessions.length * BLUE_CAP;
    const redUtilization = ((totalRedUsed / totalRedCapacity) * 100).toFixed(1);
    const blueUtilization = ((totalBlueUsed / totalBlueCapacity) * 100).toFixed(
      1,
    );

    console.error(
      `   RED rooms: ${totalRedUsed}/${totalRedCapacity} used (${redUtilization}%)`,
    );
    console.error(
      `   RED rooms with space: ${redRoomsWithSpace}/${sessions.length}`,
    );
    console.error(
      `   BLUE rooms: ${totalBlueUsed}/${totalBlueCapacity} used (${blueUtilization}%)`,
    );
    console.error(
      `   BLUE rooms with large courses: ${blueRoomsWithLargeCourse}`,
    );
    console.error(
      `   BLUE rooms available for combining: ${blueRoomsWithSpace}`,
    );

    const unplacedTotal = unplacedCourses.reduce(
      (sum, c) => sum + c.students,
      0,
    );
    const totalWastedSpace =
      totalRedCapacity - totalRedUsed + (totalBlueCapacity - totalBlueUsed);

    console.error(`\n   Unplaced courses total: ${unplacedTotal} students`);
    console.error(`   Total wasted space: ${totalWastedSpace} students`);
    console.error(
      `   Theoretical fit: ${unplacedTotal <= totalWastedSpace ? "YES - Algorithm issue!" : "NO - Need more sessions"}`,
    );

    throw new Error(
      `Failed to place ${unplacedCourses.length} courses. Total wasted space: ${totalWastedSpace} students. ${unplacedTotal <= totalWastedSpace ? "Algorithm needs improvement" : "Need more sessions"}`,
    );
  }

  // Verify no capacity violations and large course rule
  for (const session of sessions) {
    if (session.red.total > RED_CAP) {
      throw new Error(
        `RED room capacity violated in ${session.session}: ${session.red.total}/${RED_CAP}`,
      );
    }
    if (session.blue.total > BLUE_CAP) {
      throw new Error(
        `BLUE room capacity violated in ${session.session}: ${session.blue.total}/${BLUE_CAP}`,
      );
    }

    // Check large course alone rule
    const largeCourseInBlue = session.blue.courses.find((c) => c.students > 96);
    if (largeCourseInBlue && session.blue.courses.length > 1) {
      throw new Error(
        `Large course ${largeCourseInBlue.code} not alone in ${session.session} BLUE room`,
      );
    }
  }

  // Check for empty seats (should be none with best-fit)
  const emptyRedRooms = sessions.filter((s) => s.red.total === 0).length;
  const emptyBlueRooms = sessions.filter((s) => s.blue.total === 0).length;

  if (emptyRedRooms > 0 || emptyBlueRooms > 0) {
    console.warn(
      `⚠️  WARNING: ${emptyRedRooms} empty RED rooms, ${emptyBlueRooms} empty BLUE rooms`,
    );
    console.warn(`   This indicates the algorithm could be improved further`);
  }

  // Log statistics
  const sessionsUsed = sessions.filter(
    (s) => s.red.courses.length > 0 || s.blue.courses.length > 0,
  ).length;
  const totalRedUsage = sessions.reduce(
    (sum, s) => sum + s.red.courses.length,
    0,
  );
  const totalBlueUsage = sessions.reduce(
    (sum, s) => sum + s.blue.courses.length,
    0,
  );

  console.log(`\n✅ FINAL STATISTICS:`);
  console.log(`   Total sessions: ${sessions.length}`);
  console.log(`   Sessions used: ${sessionsUsed}`);
  console.log(`   RED room slots used: ${totalRedUsage}`);
  console.log(`   BLUE room slots used: ${totalBlueUsage}`);
  console.log(`   Total courses scheduled: ${placedCourses.size}`);
  console.log(`   Empty RED rooms: ${emptyRedRooms}`);
  console.log(`   Empty BLUE rooms: ${emptyBlueRooms}`);

  return sessions;
}

// Use Case: Generate Timetable
export async function POST(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { startDate, weeks } = await request.json();

    // Input Validation
    if (!startDate || !weeks) {
      return NextResponse.json(
        { error: "Start date and duration (in weeks) are required" },
        { status: 400 },
      );
    }

    if (weeks < 1 || weeks > 10) {
      return NextResponse.json(
        { error: "Weeks must be between 1 and 10." },
        { status: 400 },
      );
    }

    const totalSessions = weeks * 5 * 2;

    // Fetch Courses from Database (ISOLATED)
    const dbCourses = await prisma.course.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: { userId: parseInt(userId) } as any,
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
        { status: 400 },
      );
    }

    // Course Statistics
    const largeCourseCount = dbCourses.filter((c) => c.students > 96).length;
    const mediumCourseCount = dbCourses.filter(
      (c) => c.students >= 65 && c.students <= 96,
    ).length;
    const smallCourseCount = dbCourses.filter((c) => c.students < 65).length;

    console.log("\n📊 COURSE STATISTICS:");
    console.log(`   Total courses: ${dbCourses.length}`);
    console.log(`   Large (>96): ${largeCourseCount} courses`);
    console.log(`   Medium (65-96): ${mediumCourseCount} courses`);
    console.log(`   Small (<65): ${smallCourseCount} courses`);

    // Generate Session Metadata
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
          },
        );
      }
    }

    // Generate Timetable
    const coursesForScheduling = dbCourses.map((c) => ({
      code: c.code,
      students: c.students,
      department: c.department ?? undefined,
    }));
    const timetable = generateTimetableBestFit(
      coursesForScheduling,
      sessionsMeta,
    );

    // Validate and Return
    const validated = timetableSchema.parse({ sessions: timetable });
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
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
