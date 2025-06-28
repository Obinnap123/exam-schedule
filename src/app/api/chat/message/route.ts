import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callOpenAI } from "@/lib/openAi";
import { buildFinalPrompt } from "@/lib/promptBuilder";

export async function POST(request: Request) {
  const { chatId, content, model } = await request.json();

  // 1️⃣ Save the user message
  await prisma.chatMessage.create({
    data: {
      chatId,
      role: "user",
      content,
    },
  });

  // 2️⃣ Detect special prompt (improved)
  const schedulingPromptRegex = /act as an academic scheduling expert|generate an exam schedule|exam schedule|resource optimization/i;
  let promptToSend = content;

  if (schedulingPromptRegex.test(content)) {
    const courses = await prisma.course.findMany();
    const halls = await prisma.hall.findMany();

    promptToSend = buildFinalPrompt({
      userMessage: content,
      courses,
      halls: halls.map((hall) => ({
        name: hall.name,
        capacity: hall.capacity ?? undefined,
      })),
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
    where: { chatId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      content: true,
    },
  });

  // 4️⃣ Narrow role to "user" | "assistant"
  const formattedPriorMessages = priorMessages
    .filter((msg) => msg.role === "user" || msg.role === "assistant") // ensure role is valid
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

  const chosenModel = model || "gpt-3.5-turbo";

  // 5️⃣ Call openAI
  const assistantReply = await callOpenAI(
    [...formattedPriorMessages, { role: "user", content: promptToSend }],
    chosenModel // pass the model here
  );

  // 6️⃣ Save the assistant reply
  const replyMessage = await prisma.chatMessage.create({
    data: {
      chatId,
      role: "assistant",
      content: assistantReply,
    },
  });

  // ✅ Return the reply
  return NextResponse.json(replyMessage);
}
