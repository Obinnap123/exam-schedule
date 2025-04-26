// src/app/courses/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/Components/Modal";
import { useCourseContext } from "../../../context/CourseContext"; // Import the shared context

/* ---------- types ---------- */
type Course = {
  id: number;
  code: string;
  title: string;
  level: number;
  studentsCount: number;
  department?: string;
};

/* ---------- page ---------- */
function CoursesPage() {
  /* state */
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      code: "CSC 301",
      title: "Data Structures",
      level: 300,
      studentsCount: 150,
      department: "Computer Science",
    },
  ]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Course, "id">>({
    code: "",
    title: "",
    level: 100,
    studentsCount: 0,
    department: "",
  });

  /* Shared state for parsed courses */
  const { courses: parsedCourses, addCourses } = useCourseContext();

  /* Merge parsed courses with existing courses */
  useEffect(() => {
    if (parsedCourses.length > 0) {
      const newCourses = parsedCourses
        .filter(
          (parsedCourse: Course) =>
            !courses.some(
              (existingCourse) =>
                existingCourse.code.toUpperCase() ===
                parsedCourse.code.toUpperCase()
            )
        )
        .map((parsedCourse: Course) => ({
          ...parsedCourse,
          id: Date.now() + Math.random(), // Generate unique ID
        }));

      setCourses((prevCourses) => [...prevCourses, ...newCourses]);
    }
  }, [parsedCourses]);

  /* check for ?add=true in URL to open modal */
  const searchParams = useSearchParams();
  const shouldOpenModal = searchParams.get("add") === "true";

  useEffect(() => {
    if (shouldOpenModal) {
      setOpen(true);
    }
  }, [shouldOpenModal]);

  /* helpers */
  const resetForm = () =>
    setForm({
      code: "",
      title: "",
      level: 100,
      studentsCount: 0,
      department: "",
    });

  /* handlers */
  const addCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.title) return;

    const exists = courses.some(
      (c) => c.code.toUpperCase() === form.code.toUpperCase()
    );
    if (exists) {
      alert("Course code already exists!");
      return;
    }

    setCourses((prev) => [
      ...prev,
      { id: Date.now(), ...form, studentsCount: Number(form.studentsCount) },
    ]);
    resetForm();
    setOpen(false);
  };

  const deleteCourse = (id: number) =>
    setCourses((prev) => prev.filter((c) => c.id !== id));

  /* UI */
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Course
        </button>
      </div>

      {/* Scrollable table container */}
      <div className="max-h-[400px] overflow-y-auto scroll-thin">
        <table className="w-full overflow-hidden rounded border">
          <thead className="bg-gray-100 text-left sticky top-0 z-10">
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
            {courses.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.code}</td>
                <td className="p-3">{c.title}</td>
                <td className="p-3">{c.level}</td>
                <td className="p-3">{c.studentsCount}</td>
                <td className="p-3">{c.department ?? "-"}</td>
                <td className="p-3">
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
                <td colSpan={6} className="p-6 text-center italic text-gray-500">
                  No courses yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Course">
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