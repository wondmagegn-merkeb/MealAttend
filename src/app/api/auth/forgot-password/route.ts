
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { randomBytes, createHash } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL;

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY || !fromEmail) {
        console.error("Resend API Key or From Email is not configured.");
        return NextResponse.json({ message: 'Email service is not configured.' }, { status: 500 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // We don't want to reveal if a user exists or not for security reasons.
      // So, we send a success response even if the user is not found.
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });
    }

    // Generate a reset token
    const resetToken = randomBytes(32).toString('hex');
    const passwordResetToken = createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // Expires in 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    // Construct the reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/auth/reset-password?token=${resetToken}`;
    
    // Send the email
    await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: 'MealAttend - Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
        <p>Please click on the following link, or paste this into your browser to complete the process within one hour of receiving it:</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      `,
    });

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' }, { status: 200 });

  } catch (error: any) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
