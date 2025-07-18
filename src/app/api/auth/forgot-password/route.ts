
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import type { User } from '@prisma/client';

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
      include: {
        createdBy: true // Include the user who created this account
      }
    });

    if (!user || !user.createdBy) {
      // Don't reveal if user exists or has an admin.
      return NextResponse.json({ message: 'If an account with that email exists, a password reset request has been sent to the appropriate administrator.' }, { status: 200 });
    }

    const admin = user.createdBy;

    // Send the email to the admin
    await resend.emails.send({
      from: fromEmail,
      to: admin.email,
      subject: `MealAttend - Password Reset Request for ${user.fullName}`,
      html: `
        <h1>Password Reset Request</h1>
        <p>User <strong>${user.fullName} (${user.email})</strong> has requested a password reset for their account.</p>
        <p>Please log in to the MealAttend admin panel, navigate to the User Management section, and set a new password for them.</p>
        <p>This is a notification only. No further action is required from this email.</p>
      `,
    });

    return NextResponse.json({ message: 'If an account with that email exists, a password reset request has been sent to the appropriate administrator.' }, { status: 200 });

  } catch (error: any) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
