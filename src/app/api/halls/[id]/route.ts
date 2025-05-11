// src/app/api/halls/[id]/route.ts

import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE: Delete a hall by ID
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Ensure the ID is a valid number
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid hall ID." }, { status: 400 });
    }

    // Attempt to delete the hall
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
  } catch (error: any) {
    console.error("Error details:", error.message);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Hall not found." }, { status: 404 });
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Ensure the ID is a valid number
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid hall ID." }, { status: 400 });
    }

    // Validate input (at least one field must be provided)
    const { name, capacity } = body;
    if (!name && !capacity) {
      return NextResponse.json(
        { error: "At least one field (name or capacity) is required." },
        { status: 400 }
      );
    }

    // Prepare data for update
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

    // Attempt to update the hall
    const updatedHall = await prisma.hall.update({
      where: { id: parsedId },
      data: updateData,
    });

    if (!updatedHall) {
      return NextResponse.json({ error: "Hall not found." }, { status: 404 });
    }

    return NextResponse.json(updatedHall, { status: 200 });
  } catch (error: any) {
    console.error("Error details:", error.message);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Hall not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update hall." },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
