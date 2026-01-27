import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Await the params
  const params = await context.params;
  const { id } = params;
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
  }

  try {
    // Verify ownership
    const course = await prisma.course.findFirst({
      where: { id: parsedId, userId: parseInt(userId) }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 });
    }

    await prisma.course.delete({ where: { id: parsedId } });
    return NextResponse.json({ message: "Course deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Await the params
  const params = await context.params;
  const { id } = params;
  const userId = request.headers.get("X-User-Id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "Invalid course ID." }, { status: 400 });
  }

  const body = await request.json();
  const { code, title, level, department, students } = body;

  if (!code || !title) {
    return NextResponse.json(
      { error: "Invalid input: Course code and title are required." },
      { status: 400 }
    );
  }

  try {
    // Verify ownership
    const course = await prisma.course.findFirst({
      where: { id: parsedId, userId: parseInt(userId) }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found or unauthorized" }, { status: 404 });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parsedId },
      data: {
        code,
        title,
        level: Number(level) || 100,
        department: department || "",
        students: Number(students) || 0,
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