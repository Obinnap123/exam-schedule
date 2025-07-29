"use client";
import { createContext, useState, useContext, ReactNode } from "react";

export type ParsedCourse = {
  id?: number;
  code: string;
  title: string;
  level: number;
  students: number;
  department?: string;
};

interface CourseContextType {
  courses: ParsedCourse[];
  addCourses: (newCourses: ParsedCourse[]) => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export const CourseProvider = ({ children }: { children: ReactNode }) => {
  const [courses, setCourses] = useState<ParsedCourse[]>([]);

  const addCourses = (newCourses: ParsedCourse[]) => {
    setCourses((prev) => {
      // Filter out duplicates before adding
      const uniqueCourses = newCourses.filter(
        (newCourse) => 
          !prev.some(
            existing => existing.code.toUpperCase() === newCourse.code.toUpperCase()
          )
      );
      return [...prev, ...uniqueCourses];
    });
  };

  return (
    <CourseContext.Provider value={{ courses, addCourses }}>
      {children}
    </CourseContext.Provider>
  );
};

export const useCourseContext = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourseContext must be used within a CourseProvider");
  }
  return context;
};