"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import CSVUpload from "@/Components/CSVUpload";
import { useCourseContext } from "@/context/CourseContext";
import { downloadCSV, downloadJSON } from "@/lib/utils";
import Modal from "@/Components/Modal";
import { Calendar, AlertCircle, CheckCircle2, FileUp, Download, Clock } from "lucide-react";

export default function GenerateTimetable() {
  const { addCourses } = useCourseContext();
  const router = useRouter();

  const [alertMessage, setAlertMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [generationParams, setGenerationParams] = useState({
    startDate: "",
    weeks: 3,
  });

  const getHeaders = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return {};
    const user = JSON.parse(storedUser);
    return {
      "Content-Type": "application/json",
      "X-User-Id": user.id.toString()
    };
  };

  const handleFileParsed = async (parsedData: any[]) => {
    setAlertMessage("Processing courses...");
    setIsSuccess(false);

    try {
      const headers = getHeaders();
      // @ts-ignore - Headers check
      if (!headers["X-User-Id"]) {
        router.push("/login");
        return;
      }

      console.log("DEBUG: parsedData received from CSVUpload:", parsedData);

      const processedCourses = parsedData
        .map((course) => ({
          code: course.code || course.courseCode || "",
          title: course.title || course.courseTitle || `Course ${course.code}`,
          students: Number(course.students || course.studentsCount) || 0,
          department: course.department || "General",
          level: course.level ? Number(course.level) : 100,
        }))
        .filter((course) => course.code);

      console.log("DEBUG: processedCourses after mapping/filtering:", processedCourses);

      if (processedCourses.length === 0) {
        throw new Error("No valid course data found.");
      }

      const payload = { courses: processedCourses };
      console.log("DEBUG: Sending payload to /api/courses:", JSON.stringify(payload, null, 2));

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: headers as any,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const msg = result.message || "Failed to save courses";
        const details = `Created: ${result.createdCount || 0}, Skipped: ${result.skippedCount || 0}, Errors: ${result.errorCount || 0}`;
        const errorDetails = result.errors && result.errors.length > 0 ? ` First error: ${result.errors[0].course?.code} - ${result.errors[0].error}` : "";
        throw new Error(`${msg}. ${details}${errorDetails}`);
      }

      if (result.createdCount > 0) {
        addCourses(result.created);
      }

      let message = `Processed ${processedCourses.length} courses: `;
      message += `${result.createdCount} created`;
      if (result.skippedCount > 0)
        message += `, ${result.skippedCount} skipped`;

      setAlertMessage(message);
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Error saving courses:", error);
      setAlertMessage(`Failed to process courses: ${error.message || error}`);
      setIsSuccess(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    setIsGenerating(true);
    setAlertMessage("");

    try {
      const headers = getHeaders();
      // @ts-ignore
      if (!headers["X-User-Id"]) {
        router.push("/login");
        return;
      }

      if (!generationParams.startDate) {
        throw new Error("Please select a start date");
      }

      const response = await fetch("/api/generate-timetable", {
        method: "POST",
        headers: headers as any,
        body: JSON.stringify({
          startDate: generationParams.startDate,
          weeks: generationParams.weeks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Generation failed: ${JSON.stringify(errorData)}`);
      }

      const generatedTimetable = await response.json();
      setTimetable(generatedTimetable);
      setAlertMessage("Timetable generated successfully!");
      setIsSuccess(true);
    } catch (error: any) {
      console.error("Generation error:", error);
      setAlertMessage(`Generation failed: ${error.message || error}`);
      setIsSuccess(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Generate Timetable
          </h1>
          <p className="text-slate-500">
            Upload course data and algorithmically generate your exam schedule.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg shadow-indigo-500/20"
        >
          <Calendar className="w-4 h-4" />
          Start Generation
        </button>
      </div>

      {alertMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${isSuccess ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          {isSuccess ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="font-medium">{alertMessage}</p>
        </div>
      )}

      {/* Step 1: Upload */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg">
            <FileUp className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Step 1: Upload Course Data</h2>
        </div>
        <div className="p-6 lg:p-8">
          <p className="text-slate-600 mb-6 max-w-2xl">
            Upload a CSV file containing course codes and student counts. This data will be used to optimize room allocation.
          </p>
          <CSVUpload onFileParsed={handleFileParsed} />
        </div>
      </div>

      {isGenerating && timetable.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
          <h3 className="text-lg font-bold text-slate-900">Generating Timetable...</h3>
          <p className="text-slate-500">Optimizing slots and allocations. This may take a moment.</p>
        </div>
      )}

      {timetable.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100/50 text-green-600 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Generated Schedule</h2>
                <p className="text-sm text-slate-500">Optimization complete</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadCSV(timetable)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => downloadJSON(timetable)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-4">Session & Date</th>
                  <th className="p-4">Seat Config</th>
                  <th className="p-4">Allocated Courses</th>
                  <th className="p-4">Capacity Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {timetable.map((session, idx) => (
                  <Fragment key={idx}>
                    {/* Red Row */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-900 bg-white border-b border-slate-50" rowSpan={2}>
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold">{session.session}</div>
                            <div className="text-slate-500 font-normal mt-0.5">{session.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Red Hall
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">
                        {Array.isArray(session.red.courses)
                          ? session.red.courses.map((c: any) => `${c.code} (${c.students})`).join(", ") || "-"
                          : session.red.courses}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: session.red.utilization }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{session.red.utilization}</span>
                        </div>
                      </td>
                    </tr>
                    {/* Blue Row */}
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 border-l border-slate-100">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Blue Hall
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate">
                        {Array.isArray(session.blue.courses)
                          ? session.blue.courses.map((c: any) => `${c.code} (${c.students})`).join(", ") || "-"
                          : session.blue.courses}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: session.blue.utilization }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{session.blue.utilization}</span>
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4">
            {timetable.map((session, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{session.session}</div>
                    <div className="text-sm text-slate-500">{session.date}</div>
                  </div>
                </div>

                {/* Red Hall Mobile */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Red Hall
                    </span>
                    <span className="text-xs text-slate-500">{session.red.utilization}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">
                    {Array.isArray(session.red.courses)
                      ? session.red.courses.map((c: any) => `${c.code} (${c.students})`).join(", ") || "No courses"
                      : session.red.courses}
                  </p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: session.red.utilization }} />
                  </div>
                </div>

                {/* Blue Hall Mobile */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Blue Hall
                    </span>
                    <span className="text-xs text-slate-500">{session.blue.utilization}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">
                    {Array.isArray(session.blue.courses)
                      ? session.blue.courses.map((c: any) => `${c.code} (${c.students})`).join(", ") || "No courses"
                      : session.blue.courses}
                  </p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: session.blue.utilization }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Configure Generation"
      >
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={generationParams.startDate}
                onChange={(e) => setGenerationParams({ ...generationParams, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (Weeks)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={generationParams.weeks}
                onChange={(e) => setGenerationParams({ ...generationParams, weeks: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h4 className="text-sm font-bold text-indigo-900 mb-2">Algorithm Rules</h4>
            <ul className="text-xs text-indigo-800 space-y-1 list-disc pl-4 opacity-80">
              <li>Optimizes for minimal wasted space (Best-Fit Bin Packing)</li>
              <li>Max 30 sessions (5 days × 2 slots × 3 weeks)</li>
              <li>Separate Red (96) and Blue (192) capacities</li>
              <li>Large courses ({'>'}96) get exclusive Blue room access</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all"
            >
              Generate Schedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
