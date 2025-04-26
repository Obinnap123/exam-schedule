// src/context/CourseContext.tsx
"use client";
import { createContext, useState, useContext } from "react";

// Define the structure of a parsed course
interface ParsedCourse {
  code: string; // e.g., MTH102
  title: string; // e.g., Mathematics II
  level: number; // e.g., 100
  department: string; // e.g., Computer Science
  studentsCount: number; // e.g., 50
}

// Define the structure of a course with an ID
interface Course extends ParsedCourse {
  id: number; // Unique identifier for each course
}

// Create the context
const CourseContext = createContext<any>(null);

// Provider component to wrap the app
export const CourseProvider = ({ children }: { children: React.ReactNode }) => {
  const [courses, setCourses] = useState<ParsedCourse[]>([]); // Store parsed courses here

  // Function to add new courses
  const addCourses = (newCourses: ParsedCourse[]) => {
    setCourses((prevCourses) => [...prevCourses, ...newCourses]);
  };

  return (
    <CourseContext.Provider value={{ courses, addCourses }}>
      {children}
    </CourseContext.Provider>
  );
};

// Hook to use the context
export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourseContext must be used within a CourseProvider");
  }
  return context;
};
