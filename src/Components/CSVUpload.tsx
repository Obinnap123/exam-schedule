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

    const normalizeHeader = (header: string): string => {
      const lower = header.toLowerCase().replace(/[\s_]+/g, ""); // "Course Code" -> "coursecode"

      // Map variations to standard keys
      if (["coursecode", "code"].includes(lower)) return "code";
      if (["coursetitle", "title", "course"].includes(lower)) return "title";
      if (["studentscount", "students", "count", "numberofstudents", "studentcount"].includes(lower)) return "students";
      if (["level", "courselevel"].includes(lower)) return "level";
      if (["department", "dept"].includes(lower)) return "department";

      return lower;
    };

    const parseAndNormalize = (raw: Record<string, string>[]) => {
      if (raw.length === 0) {
        setFileError("The uploaded file is empty.");
        return;
      }

      // 1. Identify available headers from the first row
      const firstRow = raw[0];
      const headerMap: Record<string, string> = {}; // normalized -> original

      Object.keys(firstRow).forEach(originalHeader => {
        const normalized = normalizeHeader(originalHeader);
        if (normalized) {
          headerMap[normalized] = originalHeader;
        }
      });

      // 2. Strict Validation: Check for required columns
      const requiredColumns = ["code", "students"];
      const missing = requiredColumns.filter(req => !headerMap[req]);

      if (missing.length > 0) {
        const missingReadable = missing.map(m => {
          if (m === 'code') return "'Course Code'";
          if (m === 'students') return "'Students Count'";
          return m;
        }).join(", ");

        const foundReadable = Object.keys(headerMap).join(", ");
        setFileError(`Missing required columns: ${missingReadable}. Found headers like: ${foundReadable}`);
        // Log for debugging (helper for user to see what matched)
        console.error("CSV Validation Failed", { required: requiredColumns, found: headerMap, missing });
        return;
      }

      // 3. Map Data using the dynamic header map
      const standardized: ParsedCourse[] = raw.map((row) => ({
        code: (row[headerMap["code"]] || "").trim(),
        title: (row[headerMap["title"]] || "").trim(),
        level: parseInt((row[headerMap["level"]] || "0").trim(), 10),
        students: parseInt((row[headerMap["students"]] || "0").trim(), 10),
        department: (row[headerMap["department"]] || "").trim(),
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