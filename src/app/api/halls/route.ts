// src/app/api/halls/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Create a new hall
export async function POST(request: Request) {
  try {
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
      },
    });

    return NextResponse.json(hall, { status: 201 });
  } catch (error: any) {
    console.error("Error details:", error.message);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A hall with this name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create hall." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET: Fetch all halls
export async function GET() {
  try {
    const halls = await prisma.hall.findMany();
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

