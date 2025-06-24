import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
    2,
    "0"
  )}`;
}

// Helper function to get the day name
function getDayName(date: Date): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

// POST /api/generate-timetable
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      startDate,
      durationWeeks,
      examType,
      timeSlots,
      startTimes,
      examDurations,
    } = body;

    // Validate input
    if (
      !startDate ||
      !durationWeeks ||
      !examType ||
      !timeSlots ||
      !startTimes ||
      !examDurations
    ) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Fetch halls, courses, and supervisors
    const [halls, courses, supervisors] = await Promise.all([
      prisma.hall.findMany(),
      prisma.course.findMany(),
      prisma.supervisor.findMany(),
    ]);

    // Generate exam days
    const examDays: Date[] = [];
    let current = new Date(startDate);
    let added = 0;

    while (added < durationWeeks * 5) {
      const day = current.getDay();
      if (
        (examType === "full-time" && ![0, 6].includes(day)) ||
        (examType === "part-time" && [5, 6].includes(day))
      ) {
        examDays.push(new Date(current));
        added++;
      }
      current.setDate(current.getDate() + 1);
    }

    // Create timetable
    const timetable = [];
    let courseIndex = 0;

    for (const day of examDays) {
      for (const slot of timeSlots) {
        const startTime = startTimes[slot];
        const endTime = calculateEndTime(startTime, examDurations[slot]);

        const groupedCourses: string[] = [];
        const groupedHalls: string[] = [];
        const groupedSupervisors: string[] = [];

        for (const hall of halls) {
          const course = courses[courseIndex % courses.length];
          const supervisor = supervisors[courseIndex % supervisors.length];

          if (!course || !supervisor) {
            throw new Error("No available courses or supervisors.");
          }

          groupedCourses.push(course.code);
          groupedHalls.push(hall.name);
          groupedSupervisors.push(supervisor.fullName);

          courseIndex++;
        }

        // Push grouped data into the timetable
        timetable.push({
          date: day.toISOString().split("T")[0],
          day: getDayName(day),
          timeSlot: `${startTime}-${endTime}`,
          courseCodes: groupedCourses.join(", "),
          hallNames: groupedHalls.join(", "),
          supervisors: groupedSupervisors.join(", "),
        });

        // Save the timetable entry to the database
        await prisma.timetable.create({
          data: {
            date: day.toISOString().split("T")[0],
            day: getDayName(day),
            timeSlot: `${startTime}-${endTime}`,
            startTime,
            endTime,
            groupedCourseCodes: groupedCourses.join(", "),
            groupedHallNames: groupedHalls.join(", "),
            courseCode: {
              connect: { id: courses[courseIndex % courses.length].id },
            },
            hall: {
              connect: { id: halls[0]?.id || 0 },
            },
            supervisors: {
              connect: supervisors.map((s) => ({ id: s.id })),
            },
          },
        });
      }
    }

    return NextResponse.json(timetable, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate timetable." },
      { status: 500 }
    );
  }
}

// GET /api/generate-timetable
export async function GET() {
  try {
    const timetable = await prisma.timetable.findMany({
      include: {
        supervisors: true,
      },
    });

    const response = timetable.map((entry) => ({
      ...entry,
      courseCode: { code: entry.groupedCourseCodes || "N/A" },
      hall: { name: entry.groupedHallNames || "N/A" },
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch timetable." },
      { status: 500 }
    );
  }
}
