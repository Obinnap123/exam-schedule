import CoursePageClient from "./courseClient";

export const dynamic = "force-dynamic"; // disables static rendering

async function fetchInitialCourses() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      throw new Error("Environment variable NEXT_PUBLIC_APP_URL is not set.");
    }

    const response = await fetch(`${baseUrl}/api/courses`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch courses");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching courses:", error);
    return []; // fallback to empty array
  }
}

export default async function CoursesPage() {
  const initialCourses = await fetchInitialCourses();
  return <CoursePageClient initialCourses={initialCourses} />;
}
