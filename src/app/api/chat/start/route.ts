// app/api/chat/start/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const newChat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
        userId,
      },
    });

    return NextResponse.json(newChat);
  } catch (error) {
    console.error("API /chat/start error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
