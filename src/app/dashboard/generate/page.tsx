"use client";
import { useState } from "react";
import CSVUpload from "@/Components/CSVUpload";
import { useCourseContext } from "@/context/CourseContext";

function GenerateTimetablePage() {
  const { addCourses } = useCourseContext();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [examType, setExamType] = useState("full-time");
  const [endDate, setEndDate] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([
    "morning",
    "afternoon",
  ]);
  const [startTimes, setStartTimes] = useState<{ [key: string]: string }>({
    morning: "",
    afternoon: "",
    evening: "",
  });
  const [examDurations, setExamDurations] = useState<{ [key: string]: number }>(
    {
      morning: 3,
      afternoon: 3,
      evening: 3,
    }
  );
  const [generatedTimetable, setGeneratedTimetable] = useState<any[]>([]);

  // Helper Function to Convert 24-Hour Time to 12-Hour Format
  const formatTime12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  // Calculate End Time Based on Start Time and Duration
  const calculateEndTime = (
    startTime: string,
    durationHours: number
  ): string => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + durationHours * 60;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(
      2,
      "0"
    )}`;
  };

  // Handle File Upload
  const handleFileParsed = async (
    parsedData: Array<{
      code: string;
      title: string;
      level: number;
      studentsCount: number;
      department: string;
    }>
  ) => {
    try {
      const validCourses = parsedData.map((course) => ({
        code: course.code?.trim(),
        title: course.title?.trim(),
        level: course.level,
        studentsCount: course.studentsCount,
        department: course.department?.trim(),
      }));
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courses: validCourses }),
      });
      if (!response.ok) throw new Error("Failed to save courses.");
      addCourses(validCourses);
      alert("Courses parsed and saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Error parsing or saving courses.");
    }
  };

  // Calculate End Date
  const calculateEndDate = (start: string, weeks: number, type: string) => {
    let daysToAdd = 0;
    let date = new Date(start);
    while (daysToAdd < weeks * 5) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (type === "full-time" && ![0, 6].includes(day)) daysToAdd++;
      if (type === "part-time" && [5, 6].includes(day)) daysToAdd++;
    }
    setEndDate(date.toISOString().split("T")[0]);
  };

  // Handle Slot Change
  const handleSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setTimeSlots((prev) =>
      checked ? [...prev, value] : prev.filter((s) => s !== value)
    );
  };

  // Handle Start Time Change
  const handleStartTimeChange = (slot: string, value: string) => {
    setStartTimes((prev) => ({ ...prev, [slot]: value }));
  };

  // Handle Duration Change
  const handleDurationChange = (slot: string, value: string) => {
    setExamDurations((prev) => ({ ...prev, [slot]: Number(value) }));
  };

  // Handle Timetable Generation
  const handleSubmit = async () => {
    setLoading(true);
    setShowModal(false);
    try {
      const response = await fetch("/api/generate-timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          durationWeeks,
          examType,
          timeSlots,
          startTimes,
          examDurations,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate timetable.");
      const timetable = await response.json();
      setGeneratedTimetable(timetable);
    } catch (error) {
      console.error(error);
      alert("Error generating timetable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-black">Generate Timetable</h1>
      <p className="text-gray-600">
        Upload a CSV or Excel file containing course details to generate the
        timetable.
      </p>
      <CSVUpload onFileParsed={handleFileParsed} />
      <button
        onClick={() => setShowModal(true)}
        disabled={loading}
        className={`rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Generating Timetable..." : "Generate Timetable"}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 text-black bg-black bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl space-y-4 overflow-y-auto max-h-[80vh]">
            <h2 className="text-lg font-semibold">Exam Details</h2>

            {/* Exam Type */}
            <div>
              <label className="block mb-1">Exam Type</label>
              <select
                value={examType}
                onChange={(e) => {
                  setExamType(e.target.value);
                  if (startDate)
                    calculateEndDate(startDate, durationWeeks, e.target.value);
                }}
                className="w-full border px-2 py-1 rounded"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  calculateEndDate(e.target.value, durationWeeks, examType);
                }}
                className="w-full border px-2 py-1 rounded"
              />
            </div>

            {/* Duration in Weeks */}
            <div>
              <label className="block mb-1">Duration (Weeks)</label>
              <input
                type="number"
                min={1}
                value={durationWeeks}
                onChange={(e) => {
                  setDurationWeeks(Number(e.target.value));
                  if (startDate)
                    calculateEndDate(
                      startDate,
                      Number(e.target.value),
                      examType
                    );
                }}
                className="w-full border px-2 py-1 rounded"
              />
            </div>

            {/* Time Slots */}
            <div>
              <label className="block mb-1">Select Time Slots</label>
              <div className="flex flex-col space-y-1">
                {["morning", "afternoon", "evening"].map((slot) => (
                  <div key={slot} className="flex items-center space-x-2">
                    <label>
                      <input
                        type="checkbox"
                        value={slot}
                        checked={timeSlots.includes(slot)}
                        onChange={handleSlotChange}
                        className="mr-2"
                      />
                      {slot.charAt(0).toUpperCase() + slot.slice(1)}
                    </label>
                    {timeSlots.includes(slot) && (
                      <>
                        <input
                          type="time"
                          value={startTimes[slot]}
                          onChange={(e) =>
                            handleStartTimeChange(slot, e.target.value)
                          }
                          className="border px-2 py-1 rounded ml-2"
                        />
                        <input
                          type="number"
                          min={1}
                          value={examDurations[slot]}
                          onChange={(e) =>
                            handleDurationChange(slot, e.target.value)
                          }
                          className="border px-2 py-1 rounded w-16 ml-2"
                        />
                        <span>hrs</span>
                        <span className="ml-2">
                          Ends at:{" "}
                          {startTimes[slot]
                            ? formatTime12Hour(
                                calculateEndTime(
                                  startTimes[slot],
                                  examDurations[slot]
                                )
                              )
                            : "N/A"}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* End Date Display */}
            {endDate && (
              <div>
                <label className="block mb-1 font-semibold text-green-700">
                  Calculated End Date:
                </label>
                <p className="text-gray-800">{endDate}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Start Generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Timetable */}
      {generatedTimetable.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-black">Generated Timetable</h2>
          <table className="w-full border-collapse text-left text-sm text-black mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Day</th>
                <th className="p-3">Time Slot</th>
                <th className="p-3">Course Codes</th>
                <th className="p-3">Halls</th>
                <th className="p-3">Supervisors</th>
              </tr>
            </thead>
            <tbody>
              {generatedTimetable.map((entry, index) => (
                <tr
                  key={index}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                >
                  <td className="p-3">{entry.date}</td>
                  <td className="p-3">{entry.day}</td>
                  <td className="p-3">{entry.timeSlot}</td>
                  <td className="p-3">{entry.courseCodes || "N/A"}</td>
                  <td className="p-3">{entry.hallNames || "N/A"}</td>
                  <td className="p-3">{entry.supervisors || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GenerateTimetablePage;
