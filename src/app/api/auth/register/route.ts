import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // 1. Validate Database Configuration
    if (!process.env.DATABASE_URL) {
      console.error("Critical: DATABASE_URL is not defined.");
      return NextResponse.json(
        { error: "Server misconfiguration: Missing database connection string" },
        { status: 500 }
      );
    }

    // 2. Parse and Validate Request Body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields (email, password, firstName, lastName)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // 3. Database Operations
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User already exists with this email" },
          { status: 409 } // 409 Conflict is more appropriate than 400
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user without verification
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          isVerified: true, // Skip verification
        },
      });

      // Return user data without password
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...safeUser } = user;

      return NextResponse.json({
        user: safeUser,
        message: "User created successfully"
      }, { status: 201 });

    } catch (dbError: any) {
      console.error("Database operation failed:", dbError);

      // Handle Prisma specific errors
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: "User already exists with this email (Constraint violation)" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Database error occurred", details: process.env.NODE_ENV === 'development' ? dbError.message : undefined },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Registration critical error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}