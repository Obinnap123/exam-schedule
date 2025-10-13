import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { timetableSchema } from "@/lib/schemas/timetableSchema";

const prisma = new PrismaClient();

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

// Helper function to calculate utilization percentage
const calculateUtilization = (total: number, capacity: number) => {
  return `${((total / capacity) * 100).toFixed(1)}%`;
};

// Pure backend greedy algorithm for timetable generation with better bin-packing
function generateTimetableGreedy(
  courses: Course[],
  sessionsMeta: { session: string; date: string }[]
): Session[] {
  const RED_CAP = 96;
  const BLUE_CAP = 192;

  // Separate courses by type for strategic placement
  const largeCourses = courses.filter((c) => c.students > 96).sort((a, b) => b.students - a.students);
  const mediumSmallCourses = courses.filter((c) => c.students <= 96).sort((a, b) => b.students - a.students);

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

  console.log(`\n🎯 IMPROVED GREEDY ALGORITHM TIMETABLE GENERATION`);
  console.log(`Total courses: ${courses.length}`);
  console.log(`   Large courses (>96): ${largeCourses.length}`);
  console.log(`   Medium/Small courses (≤96): ${mediumSmallCourses.length}`);
  console.log(`Total sessions: ${sessions.length}`);
  console.log(`Total capacity: ${sessions.length * (RED_CAP + BLUE_CAP)} students`);
  
  // CRITICAL CHECK: Can we actually fit this?
  if (largeCourses.length > sessions.length) {
    throw new Error(
      `Cannot fit ${largeCourses.length} large courses into ${sessions.length} sessions. Each large course needs its own BLUE room. Need at least ${Math.ceil(largeCourses.length / 10)} weeks.`
    );
  }
  
  // Calculate capacity requirements
  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0);
  const totalCapacity = sessions.length * (RED_CAP + BLUE_CAP);
  const utilizationNeeded = ((totalStudents / totalCapacity) * 100).toFixed(1);
  
  // Check if we have enough capacity (accounting for fragmentation)
  const avgCapacityPerSession = (RED_CAP + BLUE_CAP) * 0.85; // 85% utilization target
  const sessionsNeeded = Math.ceil(totalStudents / avgCapacityPerSession);
  const weeksNeeded = Math.ceil(sessionsNeeded / 10);
  
  console.log(`Total students: ${totalStudents}, Need ${utilizationNeeded}% utilization`);
  console.log(`Minimum sessions needed (with fragmentation): ${sessionsNeeded} (${weeksNeeded} weeks)\n`);
  
  if (sessions.length < sessionsNeeded) {
    const currentWeeks = Math.ceil(sessions.length / 10);
    throw new Error(
      `Insufficient capacity: ${courses.length} courses (${totalStudents} students) need at least ${sessionsNeeded} sessions. You selected ${sessions.length} sessions (${currentWeeks} weeks). Minimum required: ${weeksNeeded} weeks.`
    );
  }

  // NEW STRATEGY: Fill RED rooms first, then place large courses, then fill remaining BLUE
  
  // PHASE 1: Fill ALL RED rooms with smaller courses first
  console.log(`\n📍 PHASE 1: Filling RED rooms with small/medium courses...`);
  for (const course of mediumSmallCourses) {
    let placed = false;
    
    for (const session of sessions) {
      if (session.red.total + course.students <= RED_CAP) {
        session.red.courses.push({ code: course.code, students: course.students });
        session.red.total += course.students;
        session.red.utilization = calculateUtilization(session.red.total, RED_CAP);
        placedCourses.add(course.code);
        placed = true;
        break;
      }
    }
    
    if (placed) {
      console.log(`   ✅ ${course.code}(${course.students}) → RED`);
    } else {
      // Keep for Phase 3
    }
  }
  console.log(`   Placed ${placedCourses.size} courses in RED rooms`);

  // PHASE 2: Place large courses in BLUE rooms (they MUST be alone)
  console.log(`\n📍 PHASE 2: Placing ${largeCourses.length} large courses in BLUE rooms...`);
  for (const course of largeCourses) {
    let placed = false;
    
    for (const session of sessions) {
      // Find an EMPTY BLUE room
      if (session.blue.courses.length === 0) {
        session.blue.courses.push({ code: course.code, students: course.students });
        session.blue.total = course.students;
        session.blue.utilization = calculateUtilization(course.students, BLUE_CAP);
        placedCourses.add(course.code);
        placed = true;
        console.log(`   ✅ ${course.code}(${course.students}) → ${session.session} BLUE (alone)`);
        break;
      }
    }

    if (!placed) {
      console.warn(`   ❌ No empty BLUE room for ${course.code}(${course.students})`);
      unplacedCourses.push(course);
    }
  }

  // PHASE 3: Place remaining small/medium courses in available BLUE rooms
  const remainingCourses = mediumSmallCourses.filter(c => !placedCourses.has(c.code));
  console.log(`\n📍 PHASE 3: Placing ${remainingCourses.length} remaining courses in BLUE rooms...`);
  
  for (const course of remainingCourses) {
    let placed = false;
    
    for (const session of sessions) {
      const hasLargeCourse = session.blue.courses.some((c) => c.students > 96);
      if (!hasLargeCourse && session.blue.total + course.students <= BLUE_CAP) {
        session.blue.courses.push({ code: course.code, students: course.students });
        session.blue.total += course.students;
        session.blue.utilization = calculateUtilization(session.blue.total, BLUE_CAP);
        placedCourses.add(course.code);
        placed = true;
        console.log(`   ✅ ${course.code}(${course.students}) → ${session.session} BLUE (${session.blue.total}/${BLUE_CAP})`);
        break;
      }
    }

    if (!placed) {
      console.warn(`   ❌ Could not place ${course.code}(${course.students}) - NO SPACE FOUND`);
      unplacedCourses.push(course);
    }
  }

  // Final validation
  console.log(`\n📊 PLACEMENT SUMMARY:`);
  console.log(`   Placed: ${placedCourses.size}/${courses.length} courses`);
  console.log(`   Unplaced: ${unplacedCourses.length} courses`);

  if (unplacedCourses.length > 0) {
    console.error(`\n❌ UNPLACED COURSES (${unplacedCourses.length}):`);
    unplacedCourses.forEach((c) => console.error(`   - ${c.code}(${c.students}) students`));
    
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
      const hasLarge = s.blue.courses.some(c => c.students > 96);
      if (hasLarge) blueRoomsWithLargeCourse++;
      if (!hasLarge && s.blue.total < BLUE_CAP) blueRoomsWithSpace++;
    });
    
    const totalRedCapacity = sessions.length * RED_CAP;
    const totalBlueCapacity = sessions.length * BLUE_CAP;
    const redUtilization = ((totalRedUsed / totalRedCapacity) * 100).toFixed(1);
    const blueUtilization = ((totalBlueUsed / totalBlueCapacity) * 100).toFixed(1);
    
    console.error(`   RED rooms: ${totalRedUsed}/${totalRedCapacity} used (${redUtilization}%)`);
    console.error(`   RED rooms with space: ${redRoomsWithSpace}/${sessions.length}`);
    console.error(`   BLUE rooms: ${totalBlueUsed}/${totalBlueCapacity} used (${blueUtilization}%)`);
    console.error(`   BLUE rooms with large courses: ${blueRoomsWithLargeCourse}`);
    console.error(`   BLUE rooms available for combining: ${blueRoomsWithSpace}`);
    
    const unplacedTotal = unplacedCourses.reduce((sum, c) => sum + c.students, 0);
    const totalWastedSpace = (totalRedCapacity - totalRedUsed) + (totalBlueCapacity - totalBlueUsed);
    
    console.error(`\n   Unplaced courses total: ${unplacedTotal} students`);
    console.error(`   Total wasted space: ${totalWastedSpace} students`);
    console.error(`   Theoretical fit: ${unplacedTotal <= totalWastedSpace ? 'YES - Algorithm issue!' : 'NO - Need more sessions'}`);
    
    const diagnostics = [
      `Failed to place ${unplacedCourses.length} courses (${unplacedTotal} students)`,
      `RED: ${totalRedUsed}/${totalRedCapacity} used (${redUtilization}%), ${redRoomsWithSpace} rooms have space`,
      `BLUE: ${totalBlueUsed}/${totalBlueCapacity} used (${blueUtilization}%), ${blueRoomsWithLargeCourse} blocked by large courses, ${blueRoomsWithSpace} available`,
      `Total wasted space: ${totalWastedSpace} students`,
      `Recommendation: ${unplacedTotal <= totalWastedSpace ? 'Increase weeks to 5+ to reduce fragmentation' : `Need ${Math.ceil((sessions.length + Math.ceil(unplacedTotal / 144)) / 10)} weeks minimum`}`
    ].join(' | ');
    
    throw new Error(diagnostics);
  }

  // Verify no capacity violations
  for (const session of sessions) {
    if (session.red.total > RED_CAP) {
      throw new Error(`RED room capacity violated in ${session.session}: ${session.red.total}/${RED_CAP}`);
    }
    if (session.blue.total > BLUE_CAP) {
      throw new Error(`BLUE room capacity violated in ${session.session}: ${session.blue.total}/${BLUE_CAP}`);
    }

    // Check large course alone rule
    const largeCourseInBlue = session.blue.courses.find((c) => c.students > 96);
    if (largeCourseInBlue && session.blue.courses.length > 1) {
      throw new Error(
        `Large course ${largeCourseInBlue.code} not alone in ${session.session} BLUE room`
      );
    }
  }

  // Log statistics
  const sessionsUsed = sessions.filter((s) => s.red.courses.length > 0 || s.blue.courses.length > 0).length;
  const totalRedUsage = sessions.reduce((sum, s) => sum + s.red.courses.length, 0);
  const totalBlueUsage = sessions.reduce((sum, s) => sum + s.blue.courses.length, 0);

  console.log(`\n✅ FINAL STATISTICS:`);
  console.log(`   Total sessions: ${sessions.length}`);
  console.log(`   Sessions used: ${sessionsUsed}`);
  console.log(`   RED room slots used: ${totalRedUsage}`);
  console.log(`   BLUE room slots used: ${totalBlueUsage}`);
  console.log(`   Total courses scheduled: ${placedCourses.size}`);

  return sessions;
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
          error: "No courses found in database. Please upload course data first.",
        },
        { status: 400 }
      );
    }
    
    const largeCourseCount = dbCourses.filter((c) => c.students > 96).length;
    const mediumCourseCount = dbCourses.filter((c) => c.students >= 65 && c.students <= 96).length;
    const smallCourseCount = dbCourses.filter((c) => c.students < 65).length;

    console.log("\n📊 COURSE STATISTICS:");
    console.log(`   Total courses: ${dbCourses.length}`);
    console.log(`   Large (>96): ${largeCourseCount} courses`);
    console.log(`   Medium (65-96): ${mediumCourseCount} courses`);
    console.log(`   Small (<65): ${smallCourseCount} courses`);

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

    // Generate timetable using greedy algorithm
    const coursesForScheduling = dbCourses.map(c => ({
                code: c.code,
                students: c.students,
                department: c.department ?? undefined
    }));
    const timetable = generateTimetableGreedy(coursesForScheduling, sessionsMeta);

    // Validate with schema
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
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
