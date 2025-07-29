import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ParsedCourse } from "@/types/course";

interface CSVUploadProps {
  onFileParsed: (data: ParsedCourse[]) => void;
}

function CSVUpload({ onFileParsed }: CSVUploadProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = (file.name.split(".").pop() || "").toLowerCase();

    const parseAndNormalize = (raw: Record<string, string>[]) => {
      if (raw.length === 0) {
        setFileError("The uploaded file is empty.");
        return;
      }

      // UPDATED: Changed studentsCount → students
      const standardized: ParsedCourse[] = raw.map((row) => ({
        code: (row.courseCode || row.CourseCode || "").trim(),
        title: (row.courseTitle || row.CourseTitle || "").trim(),
        level: parseInt((row.level || row.Level || "0").trim(), 10),
        students: parseInt((row.studentsCount || row.StudentsCount || "0").trim(), 10), // Key changed
        department: (row.department || row.Department || "").trim(),
      }));

      onFileParsed(standardized);
    };

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          parseAndNormalize(result.data as Record<string, string>[]);
        },
        error: () => {
          setFileError("Error parsing the CSV file.");
        },
      });
    } else if (["xls", "xlsx"].includes(fileType)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const raw = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);
        parseAndNormalize(raw);
      };
      reader.onerror = () => setFileError("Error reading the Excel file.");
      reader.readAsArrayBuffer(file);
    } else {
      setFileError("Unsupported file type. Please upload a CSV or Excel file.");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-black">
        Upload Student Course Registration File (CSV/Excel)
      </label>
      <input
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={handleFileUpload}
        className="border p-2 rounded w-full text-black"
      />
      {fileError && <p className="text-red-500 mt-2">{fileError}</p>}
    </div>
  );
}

export default CSVUpload;