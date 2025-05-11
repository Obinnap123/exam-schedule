// src/components/CSVUpload.tsx
import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface CourseRow {
  code: string;
  title: string;
  level: number;
  studentsCount: number;
  department: string;
}

interface CSVUploadProps {
  onFileParsed: (data: CourseRow[]) => void;
}

function CSVUpload({ onFileParsed }: CSVUploadProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();

    if (fileType === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const parsedData = result.data as Array<Record<string, string>>;

          if (parsedData.length === 0) {
            setFileError('The uploaded CSV file is empty.');
            return;
          }

          const validCourses: CourseRow[] = parsedData.map((row) => ({
            code: row.CourseCode?.trim(),
            title: row.CourseTitle?.trim(),
            level: parseInt(row.Level?.trim() || "0", 10),
            studentsCount: parseInt(row.StudentsCount?.trim() || "0", 10),
            department: row.Department?.trim(),
          }));

          onFileParsed(validCourses);
        },
        error: () => {
          setFileError('Error parsing the CSV file.');
        },
      });
    } else if (['xls', 'xlsx'].includes(fileType || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const parsedData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

        if (parsedData.length === 0) {
          setFileError('The uploaded Excel file is empty.');
          return;
        }

        const validCourses: CourseRow[] = parsedData.map((row) => ({
          code: row.CourseCode?.trim(),
          title: row.CourseTitle?.trim(),
          level: parseInt(row.Level?.trim() || "0", 10),
          studentsCount: parseInt(row.StudentsCount?.trim() || "0", 10),
          department: row.Department?.trim(),
        }));

        onFileParsed(validCourses);
      };
      reader.onerror = () => {
        setFileError('Error reading the Excel file.');
      };
      reader.readAsArrayBuffer(file);
    } else {
      setFileError('Unsupported file type. Please upload a CSV or Excel file.');
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
