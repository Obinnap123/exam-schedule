// src/app/api/supervisors/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE: Delete a supervisor by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const params = await context.params;
    const { id } = params;
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid supervisor ID." }, { status: 400 });
    }

    // Verify ownership
    const supervisor = await prisma.supervisor.findFirst({
      where: { id: parsedId, userId: parseInt(userId) }
    });

    if (!supervisor) {
      return NextResponse.json({ error: "Supervisor not found or unauthorized" }, { status: 404 });
    }

    await prisma.supervisor.delete({
      where: { id: parsedId },
    });

    return NextResponse.json(
      { message: "Supervisor deleted successfully." },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Supervisor not found." },
        { status: 404 }
      );
    }

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }

    return NextResponse.json(
      { error: "Failed to delete supervisor." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH: Update a supervisor by ID
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const params = await context.params;
    const { id } = params;
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid supervisor ID." }, { status: 400 });
    }

    const { fullName, email, phone, department } = body;

    // Verify ownership
    const supervisor = await prisma.supervisor.findFirst({
      where: { id: parsedId, userId: parseInt(userId) }
    });

    if (!supervisor) {
      return NextResponse.json({ error: "Supervisor not found or unauthorized" }, { status: 404 });
    }

    if (!fullName && !email && !phone && !department) {
      return NextResponse.json(
        {
          error:
            "At least one field (fullName, email, phone, or department) is required.",
        },
        { status: 400 }
      );
    }

    const updateData: {
      fullName?: string;
      email?: string;
      phone?: string;
      department?: string;
    } = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (department) updateData.department = department;

    const updatedSupervisor = await prisma.supervisor.update({
      where: { id: parsedId },
      data: updateData,
    });

    return NextResponse.json(updatedSupervisor, { status: 200 });
  } catch (error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Supervisor not found." },
        { status: 404 }
      );
    }

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Unexpected error:", error);
    }

    return NextResponse.json(
      { error: "Failed to update supervisor." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
