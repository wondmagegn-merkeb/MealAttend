
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // Find the user and update their status.
    // We use `updateMany` because `update` would throw an error if the user is not found.
    const updateResult = await prisma.user.updateMany({
        where: { email: email.toLowerCase() },
        data: { passwordResetRequested: true },
    });

    // We don't want to reveal if an email exists in the system or not.
    // So we always return a generic success message.
    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset request has been submitted to an administrator.' },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
