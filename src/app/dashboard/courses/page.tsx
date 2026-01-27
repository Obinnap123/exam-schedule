import CoursePageClient from "./courseClient";

export const dynamic = "force-dynamic"; // disables static rendering



export default function CoursesPage() {
  return <CoursePageClient initialCourses={[]} />;
}
