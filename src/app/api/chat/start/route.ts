import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId, title } = await request.json();

    if (!userId || typeof userId !== "number") {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const newChat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
        userId, // must be an integer
      },
    });

    return NextResponse.json(newChat);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}