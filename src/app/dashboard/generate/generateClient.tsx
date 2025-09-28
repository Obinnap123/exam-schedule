"use client";

import { useState, Fragment } from "react";
import CSVUpload from "@/Components/CSVUpload";
import { useCourseContext, ParsedCourse } from "@/context/CourseContext";
import { downloadCSV, downloadJSON } from "@/lib/utils";

import Modal from "@/Components/Modal";

export default function GenerateTimetable() {
  const { courses, addCourses } = useCourseContext();
  const [alertMessage, setAlertMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false); // ✅ new state
  const [timetable, setTimetable] = useState<any[]>([]);
  const [generationParams, setGenerationParams] = useState({
    startDate: "",
    weeks: 3,
  });

  const handleFileParsed = async (parsedData: any[]) => {
    setAlertMessage("Processing courses...");

    try {
      const processedCourses = parsedData
        .map((course) => ({
          code: course.code || course.courseCode || "",
          title: course.title || course.courseTitle || `Course ${course.code}`,
          students: Number(course.students || course.studentsCount) || 0,
          department: course.department || "General",
          level: course.level ? Number(course.level) : 100,
        }))
        .filter((course) => course.code);

      if (processedCourses.length === 0) {
        throw new Error("No valid course data found.");
      }

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: processedCourses }),
      });

      const result = await response.json();

      if (!response.ok) {
        const msg = result.message || "Failed to save courses";
        const details = `Created: ${result.createdCount || 0}, Skipped: ${result.skippedCount || 0}`;
        throw new Error(`${msg}. ${details}`);
      }

      if (result.createdCount > 0) {
        addCourses(result.created);
      }

      let message = `Processed ${processedCourses.length} courses: `;
      message += `${result.createdCount} created`;
      if (result.skippedCount > 0)
        message += `, ${result.skippedCount} skipped`;
      if (result.errorCount > 0) message += `, ${result.errorCount} errors`;

      setAlertMessage(message);
    } catch (error: any) {
      console.error("Error saving courses:", error);
      setAlertMessage(`Failed to process courses: ${error.message || error}`);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false); // ✅ close modal
    setIsGenerating(true); // ✅ show loading

    try {
      if (!generationParams.startDate) {
        throw new Error("Please select a start date");
      }

      const response = await fetch("/api/generate-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: generationParams.startDate,
          weeks: generationParams.weeks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Detailed error:', errorData); // Log the full error details
        throw new Error(`Generation failed: ${JSON.stringify(errorData)}`);
      }

      const generatedTimetable = await response.json();
      console.log('Generated timetable:', generatedTimetable); // Log successful generation
      setTimetable(generatedTimetable);
      setAlertMessage("Timetable generated successfully!");
    } catch (error: any) {
      console.error("Generation error:", error);
      setAlertMessage(`Generation failed: ${error.message || error}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-900 mb-8">
          Generate Exam Timetable
        </h1>

        {alertMessage && (
          <div
            className={`mb-4 rounded p-4 shadow ${
              alertMessage.toLowerCase().includes("failed") || alertMessage.toLowerCase().includes("error")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {alertMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Upload Student Course Registration File
          </h2>
          <CSVUpload onFileParsed={handleFileParsed} />
        </div>

        <button
          onClick={() => setShowModal(true)} // ✅ open modal only
          className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 mb-8"
        >
          Generate Timetable
        </button>

        {/* ✅ Show loading text when generation is in progress and timetable is not ready */}
        {isGenerating && timetable.length === 0 && (
          <div className="text-center text-indigo-600 font-medium mb-6">
            Generating timetable...
          </div>
        )}

        {timetable.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Generated Exam Timetable
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Session</th>
                    <th className="border p-2">Seat Color</th>
                    <th className="border p-2">Courses Assigned</th>
                    <th className="border p-2">Total Students</th>
                    <th className="border p-2">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((session, idx) => (
                    <Fragment key={idx}>
                      <tr>
                        <td className="border p-2 font-bold" rowSpan={2}>
                          {session.session}
                          <div className="text-sm text-gray-500">
                            {session.date}
                          </div>
                        </td>
                        <td className="border p-2 bg-red-50">Red</td>
                        <td className="border p-2">
                          {Array.isArray(session.red.courses)
                            ? session.red.courses
                                .map(
                                  (c: { code: string; students: number }) =>
                                    `${c.code} (${c.students})`
                                )

                                .join(", ")
                            : session.red.courses}
                        </td>
                        <td className="border p-2">{session.red.total}</td>
                        <td className="border p-2">
                          {session.red.utilization}
                        </td>
                      </tr>
                      <tr>
                        <td className="border p-2 bg-blue-50">Blue</td>
                        <td className="border p-2">
                          {Array.isArray(session.blue.courses)
                            ? session.blue.courses
                                .map(
                                  (c: { code: string; students: number }) =>
                                    `${c.code} (${c.students})`
                                )

                                .join(", ")
                            : session.blue.courses}
                        </td>
                        <td className="border p-2">{session.blue.total}</td>
                        <td className="border p-2">
                          {session.blue.utilization}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ Add buttons here, still inside the same div */}

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => downloadCSV(timetable)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Download as CSV
              </button>
              <button
                onClick={() => downloadJSON(timetable)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Download as JSON
              </button>
            </div>
          </div>
        )}

        <Modal
          open={showModal} // ✅ updated to use showModal
          onClose={() => setShowModal(false)}
          title="Generate Timetable"
        >
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Exam Start Date
              </label>
              <input
                type="date"
                value={generationParams.startDate}
                onChange={(e) =>
                  setGenerationParams({
                    ...generationParams,
                    startDate: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Timetable will cover 3 weeks (15 weekdays)
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Duration (in weeks)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={generationParams.weeks}
                onChange={(e) =>
                  setGenerationParams({
                    ...generationParams,
                    weeks: Number(e.target.value),
                  })
                }
                className="w-full rounded border p-2"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Each week includes 5 weekdays × 2 sessions/day
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Scheduling Constraints:</h3>
              <ul className="text-sm list-disc pl-5 space-y-1">
                <li>
                  5 weekdays × 2 sessions/day and not more than 30 sessions
                </li>
                <li>
                  One hall with 96 red seats and 192 blue seats per session
                </li>
                <li>All students from a course use the same seat color</li>
                <li>
                  Large courses (&gt;96 students) assigned exclusively to blue
                  seats
                </li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded border px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
              >
                Generate Timetable
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
