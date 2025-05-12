"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/Components/Modal";
import { useCourseContext } from "../../../context/CourseContext"; // Import the shared context

/* ---------- Types ---------- */
type Course = {
  id: number;
  code: string;
  title: string;
  level: number;
  studentsCount: number;
  department?: string;
};
type ParsedCourse = Omit<Course, "id">;

/* ---------- Page Component ---------- */
function CoursesPage() {
  /* ---------- State ---------- */
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Course, "id">>({
    code: "",
    title: "",
    level: 100,
    studentsCount: 0,
    department: "",
  });
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null); // Track the course being edited

  /* Shared state for parsed courses */
  const { courses: parsedCourses, addCourses } = useCourseContext();

  /* Fetch courses from the API */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (!response.ok) {
          throw new Error("Failed to fetch courses.");
        }
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error(error);
        alert("Error fetching courses.");
      }
    };
    fetchCourses();
  }, []);

  /* Merge parsed courses with existing courses */
  useEffect(() => {
    if (parsedCourses.length > 0) {
      const newCourses = parsedCourses
        .filter(
          (parsedCourse: ParsedCourse) =>
            !courses.some(
              (existingCourse) =>
                existingCourse.code.toUpperCase() ===
                parsedCourse.code.toUpperCase()
            )
        )
        .map((parsedCourse) => ({
          ...parsedCourse,
          id: Date.now() + Math.random(), // Generate unique ID
        }));

      if (newCourses.length > 0) {
        setCourses((prevCourses) => [...prevCourses, ...newCourses]);
      }
    }
  }, [parsedCourses]);

  /* Check for ?add=true in URL to open modal */
  const searchParams = useSearchParams();
  const shouldOpenModal = searchParams.get("add") === "true";
  useEffect(() => {
    if (shouldOpenModal) {
      setOpen(true);
    }
  }, [shouldOpenModal]);

  /* Helpers */
  const resetForm = () => {
    setForm({
      code: "",
      title: "",
      level: 100,
      studentsCount: 0,
      department: "",
    });
    setEditingCourseId(null); // Reset editing state
  };

  /* Handlers */
  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.title) return;

    try {
      const exists = courses.some(
        (c) => c.code.toUpperCase() === form.code.toUpperCase()
      );
      if (exists && editingCourseId === null) {
        alert("Course code already exists!");
        return;
      }

      if (editingCourseId !== null) {
        // Update existing course via API
        const response = await fetch(`/api/courses/${editingCourseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          throw new Error("Failed to update course.");
        }

        setCourses((prev) =>
          prev.map((course) =>
            course.id === editingCourseId
              ? {
                  id: editingCourseId,
                  ...form,
                  studentsCount: Number(form.studentsCount),
                }
              : course
          )
        );
      } else {
        // Add new course via API
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courses: [{ ...form }] }),
        });

        if (!response.ok) {
          throw new Error("Failed to save course.");
        }

        const newCourse = await response.json();
        setCourses((prev) => [...prev, newCourse[0]]);
        addCourses([newCourse[0]]); // ✅ Update shared context
      }

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error saving/updating course.");
    }
  };

  const deleteCourse = async (id: number) => {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete course.");
      }

      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error(error);
      alert("Error deleting course.");
    }
  };

  const startEditing = (course: Course) => {
    setForm({
      code: course.code,
      title: course.title,
      level: course.level,
      studentsCount: course.studentsCount,
      department: course.department || "",
    });
    setEditingCourseId(course.id);
    setOpen(true);
  };

  /* UI */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Courses</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Course
        </button>
      </div>

      {/* Scrollable Table Container */}
      <div className="max-h-[400px] overflow-y-auto scroll-thin">
        <table className="w-full border-collapse text-left text-sm text-black">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Title</th>
              <th className="p-3">Level</th>
              <th className="p-3">Students</th>
              <th className="p-3">Dept.</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, index) => (
              <tr
                key={c.id}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="p-3">{c.code}</td>
                <td className="p-3">{c.title}</td>
                <td className="p-3">{c.level}</td>
                <td className="p-3">{c.studentsCount}</td>
                <td className="p-3">{c.department ?? "-"}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => startEditing(c)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCourse(c.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-6 text-center italic text-gray-500"
                >
                  please wait...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add/Edit Course">
        <form onSubmit={addCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Course Code
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="w-full rounded border p-2"
                placeholder="CSC 301"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Level</label>
              <select
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: Number(e.target.value) })
                }
                className="w-full rounded border p-2"
              >
                {[100, 200, 300, 400, 500].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Course Title
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded border p-2"
              placeholder="Data Structures"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Number of Students
              </label>
              <input
                type="number"
                min={1}
                value={form.studentsCount}
                onChange={(e) =>
                  setForm({ ...form, studentsCount: Number(e.target.value) })
                }
                className="w-full rounded border p-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Department
              </label>
              <input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="w-full rounded border p-2"
                placeholder="Computer Science"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CoursesPage;
