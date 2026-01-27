import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courses: inputCourses } = await request.json();

    if (!Array.isArray(inputCourses)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const results = {
      created: [] as any[],
      skipped: [] as any[],
      errors: [] as any[]
    };

    for (const course of inputCourses) {
      try {
        // Validate minimum requirements
        if (!course.code) {
          results.skipped.push({ ...course, reason: "Missing course code" });
          continue;
        }

        // Check for existing course FOR THIS USER
        const existingCourse = await prisma.course.findFirst({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          where: {
            code: course.code.toUpperCase(),
            userId: parseInt(userId)
          } as any
        });

        if (existingCourse) {
          results.skipped.push({
            ...course,
            reason: `Duplicate course: ${course.code}`
          });
          continue;
        }

        // Prepare data with defaults
        const courseData = {
          code: course.code.toUpperCase(),
          title: course.title || `Course ${course.code}`,
          students: Number(course.students) || 0,
          department: course.department || "General",
          level: course.level ? Number(course.level) : 100,
          user: { connect: { id: parseInt(userId) } },
        };

        // Create new course
        const created = await prisma.course.create({
          data: courseData
        });

        results.created.push(created);
      } catch (error: any) {
        console.error(`Error creating course ${course.code}:`, error);
        results.errors.push({
          course,
          error: error.message || "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: results.created.length > 0,
      created: results.created,
      createdCount: results.created.length,
      skipped: results.skipped,
      skippedCount: results.skipped.length,
      errors: results.errors,
      errorCount: results.errors.length,
      message: results.created.length > 0
        ? `Created ${results.created.length} courses`
        : "No courses created"
    }, {
      status: results.created.length > 0 ? 201 : 400
    });
  } catch (error) {
    console.error("Error saving courses:", error);
    return NextResponse.json(
      {
        error: "Failed to process courses",
        details: (error as Error).message || String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: {
        userId: parseInt(userId),
      } as any
    });
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

