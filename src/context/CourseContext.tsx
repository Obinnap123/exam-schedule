// src/context/CourseContext.tsx
"use client";
import { createContext, useState, useContext, ReactNode } from "react";

// Define the structure of a parsed course
export interface ParsedCourse {
  code: string; // e.g., MTH102
  title: string; // e.g., Mathematics II
  level: number; // e.g., 100
  department: string; // e.g., Computer Science
  studentsCount: number; // e.g., 50
}

// Define the context type
interface CourseContextType {
  courses: ParsedCourse[];
  addCourses: (newCourses: ParsedCourse[]) => void;
}

// Create the context with default value as undefined initially
const CourseContext = createContext<CourseContextType | undefined>(undefined);

// Provider component to wrap the app
export const CourseProvider = ({ children }: { children: ReactNode }) => {
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
