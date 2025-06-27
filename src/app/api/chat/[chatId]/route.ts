// app/api/chat/[chatId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: { chatId: string } }) {
  const { chatId } = context.params;

  const chat = await prisma.chat.findUnique({
    where: { id: Number(chatId) },
    include: { messages: true },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json(chat);
}

// app/api/chat/[chatId]/route.ts

export async function PATCH(request: Request, context: { params: { chatId: string } }) {
  const { chatId } = context.params;
  const body = await request.json();
  const { title } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const updatedChat = await prisma.chat.update({
    where: { id: Number(chatId) },
    data: { title },
  });

  return NextResponse.json(updatedChat);
}


// app/api/chat/[chatId]/route.ts

export async function DELETE(request: Request, context: { params: { chatId: string } }) {
  const { chatId } = context.params;

  await prisma.chat.delete({
    where: { id: Number(chatId) },
  });

  return NextResponse.json({ message: "Chat deleted successfully" });
}
