// src/app/api/supervisors/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE: Delete a supervisor by ID
export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    await prisma.supervisor.delete({
      where: { id },
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
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const { fullName, email, phone, department } = body;

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
      where: { id },
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
