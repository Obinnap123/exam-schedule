// src/app/generate-timetable/page.tsx
"use client";
import CSVUpload from "@/Components/CSVUpload";
import { useCourseContext } from "@/context/CourseContext";

export default function GenerateTimetable() {
  const { addCourses } = useCourseContext();

  // Handle parsed CSV/Excel data
  const handleFileParsed = (parsedData: any[]) => {
    // Extract unique courses
    const uniqueCourses = Array.from(
      new Set(parsedData.map((row) => row.CourseCode))
    ).map((code) => {
      const courseData = parsedData.find((row) => row.CourseCode === code)!;
      return {
        code: courseData.CourseCode,
        title: courseData.CourseTitle,
        level: courseData.Level,
        department: courseData.Department,
        studentsCount: parsedData.filter((row) => row.CourseCode === code)
          .length,
      };
    });

    // Add parsed courses to the shared state
    addCourses(uniqueCourses);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-indigo-900 mb-8">
          Generate Exam Timetable
        </h1>

        {/* CSV/Excel Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Upload Student Course Registration File
          </h2>
          <CSVUpload onFileParsed={handleFileParsed} />
        </div>

        {/* Generate Timetable Button */}
        <button
          onClick={() => alert("Generate Timetable Logic Here")}
          className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
        >
          Generate Timetable
        </button>
      </div>
    </div>
  );
}
