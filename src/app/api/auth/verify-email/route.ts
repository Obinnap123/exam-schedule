import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    // console.log('Verifying email:', { token, email });

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Verification token and email are required' },
        { status: 400 }
      );
    }

    // Find user with this verification token and email
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(), // Token hasn't expired
        },
      },
    });

    // console.log('Found user:', user ? { id: user.id, email: user.email } : 'No user found');

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    // console.log('User verified successfully');

    // Redirect to login with success message
    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      redirect: '/login?verified=true'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'An error occurred during email verification' },
      { status: 500 }
    );
  }
}
