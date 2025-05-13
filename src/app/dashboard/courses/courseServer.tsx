import CoursePageClient from "./courseClient";

export const dynamic = "force-dynamic"; // Disable static rendering

async function fetchInitialCourses() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/courses`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch courses.");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching courses:", error);
    return []; // fallback
  }
}

export default async function CoursesPage() {
  const initialCourses = await fetchInitialCourses();

  return <CoursePageClient initialCourses={initialCourses} />;
}
