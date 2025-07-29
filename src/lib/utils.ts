import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge Tailwind class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Export data as a JSON file
export function downloadJSON(data: any, filename = "timetable.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

// Export data as a CSV file
export function downloadCSV(data: any[], filename = "timetable.csv") {
  const rows = [];

  rows.push([
    "Session",
    "Date",
    "Period",
    "Seat Color",
    "Courses",
    "Total Students",
    "Utilization",
  ]);

  data.forEach((entry) => {
    ["red", "blue"].forEach((color) => {
      rows.push([
        entry.session,
        entry.date,
        entry.period,
        color,
        Array.isArray(entry[color].courses)
          ? (entry[color].courses as { code: string; students: number }[])
              .map((c) => `${c.code} (${c.students})`)
              .join(", ")
          : entry[color].courses,
        entry[color].total,
        entry[color].utilization,
      ]);
    });
  });

  const csvContent = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
