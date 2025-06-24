// app/api/chat/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: any) {
  const { chatId } = params;

  const chat = await prisma.chat.findUnique({
    where: { id: Number(chatId) },
    include: { messages: true },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json(chat);
}
