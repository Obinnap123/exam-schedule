import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Create a new timetable entry
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      date,
      timeSlot,
      startTime,
      endTime,
      courseCode,
      courseTitle,
      hallName,
      studentsCount,
    } = body;

    const newTimetable = await prisma.timetable.create({
      data: {
        date,
        timeSlot,
        startTime,
        endTime,
        courseCode,
        courseTitle,
        hallName,
        studentsCount,
      },
    });

    return NextResponse.json(newTimetable, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create timetable entry." },
      { status: 500 }
    );
  }
}

// GET: Fetch all timetables
export async function GET() {
  try {
    const timetables = await prisma.timetable.findMany();
    return NextResponse.json(timetables, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch timetables." },
      { status: 500 }
    );
  }
}




