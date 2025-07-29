import CoursePageClient from "./courseClient";

export const dynamic = "force-dynamic"; // disables static rendering

import prisma from '@/lib/prisma';

async function fetchInitialCourses() {
  try {
    const courses = await prisma.course.findMany();
    return courses;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return []; // fallback to empty array
  }
}

export default async function CoursesPage() {
  const initialCourses = await fetchInitialCourses();
  return <CoursePageClient initialCourses={initialCourses} />;
}
