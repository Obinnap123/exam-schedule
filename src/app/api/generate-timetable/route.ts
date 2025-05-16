import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, durationWeeks, examType, timeSlots, startTimes, examDurations } = body;

    // Fetch courses, halls, and supervisors from the database
    const [courses, halls, supervisors] = await Promise.all([
      prisma.course.findMany(),
      prisma.hall.findMany(),
      prisma.supervisor.findMany(),
    ]);

    // Generate exam days based on the input parameters
    const examDays: Date[] = [];
    let currentDate = new Date(startDate);
    let addedDays = 0;

    while (addedDays < durationWeeks * 5) {
      const dayOfWeek = currentDate.getDay();
      if (
        (examType === "full-time" && ![0, 6].includes(dayOfWeek)) || // Exclude weekends for full-time
        (examType === "part-time" && [5, 6].includes(dayOfWeek)) // Include only Friday and Saturday for part-time
      ) {
        examDays.push(new Date(currentDate));
        addedDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Logic to generate timetable entries
    const timetable = [];
    for (const day of examDays) {
      for (const slot of timeSlots) {
        const startTime = startTimes[slot];
        const endTime = calculateEndTime(startTime, examDurations[slot]);

        const course = courses.shift(); // Assign courses sequentially
        const hall = halls[Math.floor(Math.random() * halls.length)]; // Randomly assign a hall

        if (course) {
          timetable.push({
            date: day.toISOString().split("T")[0],
            timeSlot: slot,
            startTime,
            endTime,
            courseCode: course.code,
            courseTitle: course.title,
            hallName: hall.name,
            studentsCount: course.studentsCount,
            supervisors: supervisors.slice(0, 2).map((supervisor) => supervisor.id), // Use supervisor IDs
          });
        }
      }
    }

    // Save generated timetable entries to the database
    for (const entry of timetable) {
      await prisma.timetable.create({
        data: {
          date: entry.date,
          timeSlot: entry.timeSlot,
          startTime: entry.startTime,
          endTime: entry.endTime,
          courseCode: entry.courseCode,
          courseTitle: entry.courseTitle,
          hallName: entry.hallName,
          studentsCount: entry.studentsCount,
          supervisors: {
            connect: entry.supervisors.map((id) => ({ id })), // Connect supervisors by ID
          },
        },
      });
    }

    return NextResponse.json(timetable, { status: 200 });
  } catch (error) {
    console.error("Error generating timetable:", error);
    return NextResponse.json(
      { error: "Failed to generate timetable. Please check the server logs." },
      { status: 500 }
    );
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