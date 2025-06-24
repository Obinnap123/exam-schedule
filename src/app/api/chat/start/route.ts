// app/api/chat/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, title } = body;

  const newChat = await prisma.chat.create({
    data: {
      title: title || "New Chat",
      userId, // Or null if no user
    },
  });
  
  return NextResponse.json(newChat);
}
