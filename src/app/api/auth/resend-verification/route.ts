import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        isVerified: false,
        verificationTokenExpiry: {
          gt: new Date() // Token hasn't expired
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        verificationToken: true,
        verificationTokenExpiry: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No pending verification found' },
        { status: 404 }
      );
    }

    // Generate new token
    const { token, expiry } = generateVerificationToken();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpiry: expiry
      }
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, token, user.firstName);

      return NextResponse.json({
        message: "Verification email has been resent",
        email: user.email
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      if (emailError instanceof Error) {
        console.error('Email error details:', {
          name: emailError.name,
          message: emailError.message,
          stack: emailError.stack
        });
      }
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'An error occurred while resending verification email' },
      { status: 500 }
    );
  }
}
