import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/generate-timetable
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, durationWeeks, examType, timeSlots, startTimes, examDurations } = body;

    // Validate input
    if (!startDate || !durationWeeks || !examType || !timeSlots || !startTimes || !examDurations) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
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

        for (const hall of halls) {
          const course = courses[courseIndex % courses.length];
          const supervisor = supervisors[courseIndex % supervisors.length];

          if (!course || !supervisor) {
            throw new Error("No available courses or supervisors.");
          }

          timetable.push({
            date: day.toISOString().split("T")[0],
            timeSlot: slot,
            startTime,
            endTime,
            courseCode: course.code,
            hallName: hall.name,
            supervisors: [{ id: supervisor.id }],
          });

          courseIndex++;
        }
      }
    }

    return NextResponse.json(timetable, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate timetable." }, { status: 500 });
  }
}

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationHours: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}