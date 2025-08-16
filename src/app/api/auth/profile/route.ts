
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    // In a real app, you'd get the user ID from a validated JWT token.
    // Here we'll expect it in the body for simplicity.
    const { userId, fullName, profileImageURL } = await request.json();
    console.log("Profile Update API Request:", { userId, fullName, profileImageURL })

    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }
    if (!fullName) {
      return NextResponse.json({ message: 'Full name is required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { userId: userId },
      data: {
        fullName,
        profileImageURL: profileImageURL,
      },
       include: { 
        createdBy: {
          select: { id: true, userId: true, fullName: true }
        }
       },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ message: 'Profile updated successfully', user: userWithoutPassword }, { status: 200 });

  } catch (error: any) {
    if (error.code === 'P2025') {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    console.error("Profile Update API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
