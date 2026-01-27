// src/app/api/halls/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Create a new hall
export async function POST(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, capacity } = body;

    if (!name || capacity == null) {
      return NextResponse.json(
        { error: "Name and capacity are required." },
        { status: 400 }
      );
    }

    const parsedCapacity =
      typeof capacity === "string" ? parseInt(capacity, 10) : capacity;

    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return NextResponse.json(
        { error: "Capacity must be a positive integer." },
        { status: 400 }
      );
    }

    const hall = await prisma.hall.create({
      data: {
        name,
        capacity: parsedCapacity,
        user: {
          connect: { id: parseInt(userId) }
        }
      },
    });

    return NextResponse.json(hall, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A hall with this name already exists." },
        { status: 409 }
      );
    }
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Unexpected error details:", error);
    }

    return NextResponse.json(
      { error: "Failed to create hall." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET: Fetch all halls for the logged-in user
export async function GET(request: Request) {
  try {
    const userId = request.headers.get("X-User-Id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const halls = await prisma.hall.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: {
        userId: parseInt(userId),
      } as any,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(halls, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch halls." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
