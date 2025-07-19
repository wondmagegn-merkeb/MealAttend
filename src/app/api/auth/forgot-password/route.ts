
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendForgotPasswordNotification } from '@/lib/email';
import type { User } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const [user, settings] = await Promise.all([
        prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { createdBy: true }
        }),
        prisma.appSettings.findUnique({ where: { id: 1 } })
    ]);

    // Don't reveal if user exists.
    // If user and their creator exists, send the notification.
    if (user && user.createdBy) {
      const admin = user.createdBy;
      try {
        await sendForgotPasswordNotification({
            adminEmail: admin.email,
            userName: user.fullName,
            userEmail: user.email,
            siteName: settings?.siteName || 'MealAttend'
        });
      } catch (emailError: any) {
        // Log the email sending error but still return a generic success message to the user.
        console.error("Forgot Password API - Email Sending Error:", emailError);
      }
    }

    // Always return a generic message to prevent user enumeration attacks.
    return NextResponse.json({ message: 'If an account with that email exists and has an associated administrator, a password reset request has been sent to them.' }, { status: 200 });

  } catch (error: any) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
