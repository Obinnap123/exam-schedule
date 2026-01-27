"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Modal from "@/Components/Modal";
import { useCourseContext, ParsedCourse } from "@/context/CourseContext";

type Course = {
  id: number;
  code: string;
  title: string;
  level: number;
  students: number;
  department?: string;
};

interface CoursePageClientProps {
  initialCourses: Course[];
}

function CoursePageClient({ initialCourses }: CoursePageClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ParsedCourse>({
    code: "",
    title: "",
    level: 100,
    students: 0,
    department: "",
  });
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  const { courses: parsedCourses, addCourses } = useCourseContext();
  const searchParams = useSearchParams();
  const shouldOpenModal = searchParams.get("add") === "true";

  useEffect(() => {
    if (shouldOpenModal) {
      setOpen(true);
    }
  }, [shouldOpenModal]);

  // Auth Helper
  const getAuthHeaders = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return null;
    }
    const user = JSON.parse(storedUser);
    return {
      "Content-Type": "application/json",
      "X-User-Id": user.id.toString(),
    };
  };

  useEffect(() => {
    const refreshCourses = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const response = await fetch("/api/courses", { headers });
        if (response.status === 401) {
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch courses.");
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error refreshing courses:", error);
      }
    };

    refreshCourses();
  }, [initialCourses]); // Run once on mount (since initialCourses is empty now)

  const resetForm = () => {
    setForm({
      code: "",
      title: "",
      level: 100,
      students: 0,
      department: "",
    });
    setEditingCourseId(null);
  };

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.title) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const method = editingCourseId ? "PATCH" : "POST";
      const url = editingCourseId
        ? `/api/courses/${editingCourseId}`
        : "/api/courses";

      const body = editingCourseId
        ? JSON.stringify(form)
        : JSON.stringify({ courses: [{ ...form }] });

      const response = await fetch(url, {
        method,
        headers,
        body
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Request failed");
      }

      if (editingCourseId) {
        // Update existing course
        setCourses(prev =>
          prev.map(course =>
            course.id === editingCourseId
              ? { ...course, ...form, students: Number(form.students) }
              : course
          )
        );
      } else {
        // Add new course
        const newCourse = {
          ...form,
          id: result.created?.[0]?.id || Date.now(),
          students: Number(form.students)
        };

        setCourses(prev => [...prev, newCourse]);
        addCourses([newCourse]);
      }

      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    }
  };

  const editCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setForm({
      code: course.code,
      title: course.title,
      level: course.level,
      students: course.students,
      department: course.department || "",
    });
    setOpen(true);
  };

  const deleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) throw new Error("Failed to delete course.");

      setCourses(prev => prev.filter(course => course.id !== id));
    } catch (error) {
      console.error(error);
      alert("Error deleting course.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Courses</h1>
        <button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 shadow-md transition-all font-medium"
        >
          + Add Course
        </button>
      </div>

      {/* Responsive Layout: Table on Desktop, Cards on Mobile */}

      {/* Desktop Table */}
      <div className="hidden md:block max-h-[600px] overflow-auto rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full border-collapse text-left text-sm text-slate-700">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="p-4 font-semibold text-slate-900">Code</th>
              <th className="p-4 font-semibold text-slate-900">Title</th>
              <th className="p-4 font-semibold text-slate-900">Level</th>
              <th className="p-4 font-semibold text-slate-900">Students</th>
              <th className="p-4 font-semibold text-slate-900">Department</th>
              <th className="p-4 font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{course.code}</td>
                <td className="p-4">{course.title}</td>
                <td className="p-4">{course.level}</td>
                <td className="p-4">{course.students}</td>
                <td className="p-4">{course.department || "-"}</td>
                <td className="p-4 space-x-3">
                  <button
                    onClick={() => editCourse(course)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                  No courses found. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{course.code}</h3>
                <p className="text-sm text-slate-600">{course.title}</p>
              </div>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                Lvl {course.level}
              </span>
            </div>
            <div className="text-sm text-slate-500 flex justify-between">
              <span>{course.students} Students</span>
              <span>{course.department}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => editCourse(course)}
                className="text-sm font-medium text-indigo-600"
              >
                Edit
              </button>
              <button
                onClick={() => deleteCourse(course.id)}
                className="text-sm font-medium text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            No courses found.
          </div>
        )}
      </div>

      {/* Modal with Form */}
      <Modal open={open} onClose={() => setOpen(false)} title={editingCourseId ? "Edit Course" : "Add New Course"}>
        <form onSubmit={addCourse} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Course Code
              </label>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="CSC 301"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Level</label>
              <select
                value={form.level}
                onChange={(e) =>
                  setForm({ ...form, level: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Course Title
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Data Structures"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Number of Students
              </label>
              <input
                type="number"
                min={1}
                value={form.students}
                onChange={(e) =>
                  setForm({ ...form, students: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Department
              </label>
              <input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Computer Science"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg font-medium transition-all"
            >
              {editingCourseId ? "Save Changes" : "Create Course"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CoursePageClient;