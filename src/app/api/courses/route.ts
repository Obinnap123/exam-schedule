// src/app/api/courses/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Save courses to the database
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courses } = body;

    // Validate input
    if (!Array.isArray(courses)) {
      return NextResponse.json(
        { error: 'Invalid input: Expected an array of courses.' },
        { status: 400 }
      );
    }

    // Use createMany for bulk insertion
    const savedCourses = await prisma.course.createMany({
      data: courses.map((course) => ({
        code: course.code,
        title: course.title,
        level: course.level,
        department: course.department,
        studentsCount: course.studentsCount,
      })),
      skipDuplicates: true, // Skip duplicate course codes
    });

    return NextResponse.json(
      { message: `${savedCourses.count} courses saved successfully!` },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to save courses.' },
      { status: 500 }
    );
  }
}

// GET: Fetch all courses from the database
export async function GET() {
  try {
    const courses = await prisma.course.findMany();
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch courses.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a course by ID
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split('/').pop() || '', 10);

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid course ID.' },
        { status: 400 }
      );
    }

    // Delete the course
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Course deleted successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to delete course.' },
      { status: 500 }
    );
  }
}