// src/app/api/halls/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// DELETE: Delete a hall by ID
export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const params = await context.params;
    const { id } = params;

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid hall ID." }, { status: 400 });
    }

    const deletedHall = await prisma.hall.delete({
      where: { id: parsedId },
    });

    if (!deletedHall) {
      return NextResponse.json({ error: "Hall not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Hall deleted successfully." },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Hall not found." }, { status: 404 });
    }

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Unknown error:", error);
    }

    return NextResponse.json(
      { error: "Failed to delete hall." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH: Update a hall by ID
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid hall ID." }, { status: 400 });
    }

    const { name, capacity } = body;
    if (!name && !capacity) {
      return NextResponse.json(
        { error: "At least one field (name or capacity) is required." },
        { status: 400 }
      );
    }

    const updateData: { name?: string; capacity?: number } = {};
    if (name) updateData.name = name;
    if (capacity !== undefined) {
      const parsedCapacity = parseInt(capacity, 10);
      if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
        return NextResponse.json(
          { error: "Capacity must be a positive integer." },
          { status: 400 }
        );
      }
      updateData.capacity = parsedCapacity;
    }

    const updatedHall = await prisma.hall.update({
      where: { id: parsedId },
      data: updateData,
    });

    if (!updatedHall) {
      return NextResponse.json({ error: "Hall not found." }, { status: 404 });
    }

    return NextResponse.json(updatedHall, { status: 200 });
  } catch (error: unknown) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Hall not found." }, { status: 404 });
    }

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    } else {
      console.error("Unknown error:", error);
    }

    return NextResponse.json(
      { error: "Failed to update hall." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
