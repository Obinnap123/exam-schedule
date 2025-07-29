import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callOpenAI } from "@/lib/openAi";
import { buildFinalPrompt } from "@/lib/promptBuilder";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import Papa from "papaparse";

// Helper to save the uploaded file to disk
async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const fileName = `${uuidv4()}_${file.name}`;
  const filePath = path.join(uploadsDir, fileName);

  // Ensure uploads directory exists
  await import("fs/promises").then(fs => fs.mkdir(uploadsDir, { recursive: true }));

  await import("fs/promises").then(fs => fs.writeFile(filePath, buffer));
  // Return the public URL
  return `/uploads/${fileName}`;
}

// Helper to parse CSV file content into course objects
function parseCoursesFromCSV(csvText: string) {
  // Expecting columns: code, name, students
  const { data } = Papa.parse(csvText.trim(), { header: true, skipEmptyLines: true });
  // Map to expected format
  return (data as any[]).map(row => ({
    code: row.code || row.Code || row.CODE,
    title: row.name || row.Name || row.NAME || row.title || row.Title || row.TITLE,
    studentsCount: Number(row.students || row.Students || row.STUDENTS || row.studentsCount),
  })).filter(c => c.code && c.title && !isNaN(c.studentsCount));
}

export async function POST(request: Request) {
  // Accept FormData for file upload
  const contentType = request.headers.get("content-type") || "";
  let chatId: any, content: string = "", model: string | undefined, file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    chatId = form.get("chatId");
    content = form.get("content") as string;
    model = form.get("model") as string | undefined;
    file = form.get("file") as File | null;
  } else {
    // fallback for JSON requests
    const body = await request.json();
    chatId = body.chatId;
    content = body.content;
    model = body.model;
  }

  // 1️⃣ Save the user message (with fileUrl if any)
  let fileUrl: string | undefined = undefined;
  let fileType: string | undefined = undefined;
  let fileName: string | undefined = undefined;
  let fileText: string | undefined = undefined;

  if (file && typeof File !== "undefined" && file instanceof File) {
    fileUrl = await saveUploadedFile(file);
    fileType = file.type;
    fileName = file.name;

    // Read file content if it's text/csv
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      fileText = await file.text();
    }
  }

  await prisma.chatMessage.create({
    data: {
      chatId: typeof chatId === "string" ? Number(chatId) : chatId,
      role: "user",
      content,
      // Optionally, save fileUrl or fileText in your DB if you add columns
    },
  });

  // 2️⃣ Detect special scheduling prompt
  const schedulingPromptRegex =
    /act as an academic scheduling expert|generate an exam schedule|exam schedule|resource optimization/i;
  let promptToSend = content;

  if (schedulingPromptRegex.test(content)) {
    let courses: { code: string; title: string; studentsCount: number }[] = [];
    let halls: { name: string; capacity?: number }[] = [];

    if (fileText) {
      // Parse courses from CSV file
      courses = parseCoursesFromCSV(fileText);
      // Use default hall if not in CSV
      halls = [{ name: "Main Hall", capacity: 288 }];
    } else {
      // Get from DB
      const coursesFromDb = await prisma.course.findMany();
      courses = coursesFromDb.map((course) => ({
        code: course.code,
        title: course.name,
        studentsCount: course.students,
      }));
      halls = await prisma.hall.findMany();
      halls = halls.map((hall) => ({
        name: hall.name,
        capacity: hall.capacity ?? undefined,
      }));
    }

    promptToSend = buildFinalPrompt({
      userMessage: content,
      courses,
      halls,
      constraints: {
        sessions: 30,
        examType: "full-time",
        noWeekends: true,
        seating: {
          redSeats: 96,
          blueSeats: 192,
        },
        rules: {
          critical:
            "All students from a single course must use the SAME SEAT COLOR. No mixed-color assignment.",
          largeCourses:
            "Assign exclusively to blue seats. Split across sessions if needed, while preserving color purity.",
          redSeatPacking:
            "Prioritize courses ≤96 students. Combine smaller courses to fill 96 seats precisely. Never exceed 96.",
          blueSeatEfficiency:
            "Assign courses to approach 192. Use leftover space for smaller courses after placing large courses.",
        },
        outputFormat:
          "| Session | Seat Color | Courses Assigned (Students) | Total | Utilization |\n|---|---|---|---|---|",
      },
    });
  }

  // 3️⃣ Get prior messages for context
  const priorMessages = await prisma.chatMessage.findMany({
    where: { chatId: typeof chatId === "string" ? Number(chatId) : chatId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      content: true,
    },
  });

  // 4️⃣ Narrow role to "user" | "assistant"
  const formattedPriorMessages = priorMessages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

  // 4b️⃣ Add file content to prompt if present and not CSV
  let aiPrompt = promptToSend;
  if (fileText && !(fileType === "text/csv" || (fileName && fileName.endsWith(".csv")))) {
    aiPrompt += `\n\n[File content]:\n${fileText}`;
  } else if (fileUrl && !fileText) {
    aiPrompt += `\n\n[User uploaded a file: ${fileUrl}]`;
  }

  const chosenModel = model || "gpt-3.5-turbo";

  // 5️⃣ Call openAI
  const assistantReply = await callOpenAI(
    [...formattedPriorMessages, { role: "user", content: aiPrompt }],
    chosenModel
  );

  // 6️⃣ Save the assistant reply
  const replyMessage = await prisma.chatMessage.create({
    data: {
      chatId: typeof chatId === "string" ? Number(chatId) : chatId,
      role: "assistant",
      content: assistantReply,
    },
  });

  // ✅ Return the reply
  return NextResponse.json(replyMessage);
}