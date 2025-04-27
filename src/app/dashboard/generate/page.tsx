// src/app/generate-timetable/page.tsx
"use client";

import { useState } from "react";
import CSVUpload from "@/Components/CSVUpload"; // Import the CSVUpload component
import { useCourseContext } from "@/context/CourseContext"; // Import the shared context

function GenerateTimetablePage() {
  const { addCourses } = useCourseContext(); // Use the shared context to add courses
  const [loading, setLoading] = useState(false); // Loading state for timetable generation

  /* Handle parsed CSV/Excel data */
  const handleFileParsed = async (parsedData: Array<{ code: string; title: string; level: number; studentsCount: number; department: string }>) => {
    try {
      // Validate parsed data
      const validCourses = parsedData.map((course) => ({
        code: course.code?.trim(),
        title: course.title?.trim(),
        level: course.level,
        studentsCount: course.studentsCount,
        department: course.department?.trim(),
      }));

      // Save parsed courses to the database
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: validCourses }),
      });

      if (!response.ok) {
        throw new Error("Failed to save courses.");
      }

      // Add parsed courses to shared state
      addCourses(validCourses);

      alert("Courses parsed and saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Error parsing or saving courses.");
    }
  };

  /* Handle Generate Timetable Button Click */
  const handleGenerateTimetable = async () => {
    setLoading(true); // Start loading

    try {
      // Simulate timetable generation process
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      alert("Timetable generated successfully!");
    } catch (error) {
      console.error(error);
      alert("Error generating timetable.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-black">Generate Timetable</h1>
      <p className="text-gray-600">
        Upload a CSV or Excel file containing course details to generate the timetable.
      </p>

      {/* CSV/Excel Upload Component */}
      <CSVUpload onFileParsed={handleFileParsed} />

      {/* Generate Timetable Button */}
      <button
        onClick={handleGenerateTimetable}
        disabled={loading}
        className={`rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Generating Timetable..." : "Generate Timetable"}
      </button>
    </div>
  );
}

export default GenerateTimetablePage;