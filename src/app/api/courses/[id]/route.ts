// src/app/api/courses/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  _: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const parsedId = parseInt(id, 10);

  if (!parsedId) {
    return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
  }

  try {
    await prisma.course.delete({
      where: { id: parsedId },
    });

    return NextResponse.json(
      { message: "Course deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete course." },
      { status: 500 }
    );
  }
}

// PATCH: Update a course by ID
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const parsedId = parseInt(id, 10);

  if (!parsedId) {
    return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
  }

  const body = await request.json();
  const { code, title, level, department, studentsCount } = body;

  if (!code || !title || !level || !department || !studentsCount) {
    return NextResponse.json(
      { error: "Invalid input: All fields are required." },
      { status: 400 }
    );
  }

  try {
    const updatedCourse = await prisma.course.update({
      where: { id: parsedId },
      data: {
        code,
        title,
        level,
        department,
        studentsCount,
      },
    });

    return NextResponse.json(
      { message: "Course updated successfully!", course: updatedCourse },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update course." },
      { status: 500 }
    );
  }
}
