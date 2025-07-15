
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createHash } from 'crypto';
import { hash } from 'bcryptjs';

const saltRounds = 10;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and new password are required' }, { status: 400 });
    }

    if (password.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { gt: new Date() },
        }
    });

    if (!user) {
        return NextResponse.json({ message: 'Password reset token is invalid or has expired.' }, { status: 400 });
    }

    const hashedPassword = await hash(password, saltRounds);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordChangeRequired: false,
            passwordResetToken: null,
            passwordResetExpires: null,
        }
    });

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
