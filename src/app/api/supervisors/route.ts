// src/app/api/supervisors/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Create a new supervisor
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phone, department } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const existingSupervisor = await prisma.supervisor.findUnique({
      where: { email },
    });

    if (existingSupervisor) {
      return NextResponse.json(
        { error: "A supervisor with this email already exists." },
        { status: 409 }
      );
    }

    const newSupervisor = await prisma.supervisor.create({
      data: {
        fullName,
        email,
        phone,
        department, // include department here
      },
    });

    return NextResponse.json(newSupervisor, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A supervisor with this email already exists." },
        { status: 409 }
      );
    }

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }

    return NextResponse.json(
      { error: "Failed to create supervisor." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET: Fetch all supervisors
export async function GET() {
  try {
    const supervisors = await prisma.supervisor.findMany();
    return NextResponse.json(supervisors, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch supervisors." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
