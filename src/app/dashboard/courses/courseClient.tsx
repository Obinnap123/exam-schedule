"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/Components/Modal";
import { useCourseContext } from "../../../context/CourseContext";

type Course = {
  id: number;
  code: string;
  title: string;
  level: number;
  studentsCount: number;
  department?: string;
};
type ParsedCourse = Omit<Course, "id">;

interface CoursePageClientProps {
  initialCourses: Course[];
}

function CoursePageClient({ initialCourses }: CoursePageClientProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ParsedCourse>({
    code: "",
    title: "",
    level: 100,
    studentsCount: 0,
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

  // Refresh from backend only if initialCourses is empty
  useEffect(() => {
    const refreshCourses = async () => {
      try {
        const response = await fetch("/api/courses");
        if (!response.ok) throw new Error("Failed to fetch courses.");
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error("Error refreshing courses:", error);
      }
    };

    if (initialCourses.length === 0) {
      refreshCourses();
    }
  }, [initialCourses]);

  useEffect(() => {
    if (parsedCourses.length > 0) {
      const newCourses = parsedCourses
        .filter(
          (parsed) =>
            !courses.some(
              (existing) =>
                existing.code.toUpperCase() === parsed.code.toUpperCase()
            )
        )
        .map((parsed) => ({
          ...parsed,
          id: Date.now() + Math.random(),
        }));

      if (newCourses.length > 0) {
        setCourses((prev) => [...prev, ...newCourses]);
      }
    }
  }, [parsedCourses, courses]);

  const resetForm = () => {
    setForm({
      code: "",
      title: "",
      level: 100,
      studentsCount: 0,
      department: "",
    });
    setEditingCourseId(null);
  };

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
        const response = await fetch(`/api/courses/${editingCourseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        if (!response.ok) throw new Error("Failed to update course.");

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
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courses: [{ ...form }] }),
        });

        if (!response.ok) throw new Error("Failed to save course.");

        const newCourse = await response.json();
        setCourses((prev) => [...prev, newCourse[0]]);
        addCourses([newCourse[0]]);
      }

      resetForm();
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error saving course.");
    }
  };

  const editCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setForm({
      code: course.code,
      title: course.title,
      level: course.level,
      studentsCount: course.studentsCount,
      department: course.department || "",
    });
    setOpen(true);
  };

  const deleteCourse = async (id: number) => {
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete course.");

      setCourses((prev) => prev.filter((course) => course.id !== id));
    } catch (error) {
      console.error(error);
      alert("Error deleting course.");
    }
  };

  // ✨ Your UI code remains the same here (table, modal, etc.)
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
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Course
        </button>
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-x-auto scroll-thin">
        <table className="w-full border-collapse text-left text-sm text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Title</th>
              <th className="p-3">Level</th>
              <th className="p-3">Students</th>
              <th className="p-3">Department</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr
                key={course.id}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="p-3">{course.code}</td>
                <td className="p-3">{course.title}</td>
                <td className="p-3">{course.level}</td>
                <td className="p-3">{course.studentsCount}</td>
                <td className="p-3">{course.department}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => editCourse(course)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCourse(course.id)}
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
                  No courses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingCourseId !== null ? "Edit Course" : "Add Course"}
      >
        <form onSubmit={addCourse} className="space-y-4">
          {/* Code, Title, Level, Department, StudentsCount Inputs */}
          {/* same structure as you had before */}
        </form>
      </Modal>
    </div>
  );
}

export default CoursePageClient;
