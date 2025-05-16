import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
// import prisma from "@/lib/prisma";

const prisma = new PrismaClient();

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate the ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Invalid ID." }, { status: 400 });
    }

    // Check if the record exists
    const existingEntry = await prisma.timetable.findUnique({
      where: { id: Number(id) },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Timetable entry not found." },
        { status: 404 }
      );
    }

    // Delete the record
    await prisma.timetable.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json(
      { message: "Timetable entry deleted." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to delete timetable entry." },
      { status: 500 }
    );
  }
}
//PATCH// Editing the time table

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extract the ID from the URL parameters
    const { id } = params;

    // Validate the ID
    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "Invalid ID." },
        { status: 400 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Ensure the request body contains valid updates
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: "No updates provided." },
        { status: 400 }
      );
    }

    // Check if the record exists
    const existingEntry = await prisma.timetable.findUnique({
      where: { id: Number(id) },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Timetable entry not found." },
        { status: 404 }
      );
    }

    // Update the record
    const updatedTimetable = await prisma.timetable.update({
      where: { id: Number(id) },
      data: body,
    });

    return NextResponse.json(updatedTimetable, { status: 200 });
  } catch (error) {
    // Handle errors gracefully
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);

      return NextResponse.json(
        { error: error.message || "Failed to update timetable entry." },
        { status: 500 }
      );
    } else {
      console.error("Unknown Error:", error);

      return NextResponse.json(
        { error: "An unexpected error occurred." },
        { status: 500 }
      );
    }
  }
}
