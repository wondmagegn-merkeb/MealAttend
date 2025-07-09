
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ message: 'User ID and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ message: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // In a real app, you would hash the password before saving
    // For this demo, we store it as is.

    const user = await prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { userId: userId },
      data: {
        password: newPassword,
        passwordChangeRequired: false,
      },
      include: {
        department: true,
      }
    });
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ message: 'Password updated successfully', user: userWithoutPassword }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'P2025') { // Prisma code for record not found
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    console.error("Change Password API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
