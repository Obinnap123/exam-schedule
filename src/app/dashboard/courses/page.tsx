import CoursePageClient from "./courseClient";

export const dynamic = "force-dynamic"; // disables static rendering

async function fetchInitialCourses() {
  const res = await fetch("http://localhost:3000/api/courses", {
    cache: "no-store",
  });
  const data = await res.json();
  return data;
}

export default async function CoursesPage() {
  const initialCourses = await fetchInitialCourses();

  return <CoursePageClient initialCourses={initialCourses} />;
}
