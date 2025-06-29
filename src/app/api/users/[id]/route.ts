
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string; // This is the internal ID ('user_1'), not the ADERA ID
  };
}

// GET a single user
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { department: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch user', error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE a user
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const { fullName, email, departmentId, role, status, profileImageURL } = data;

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        fullName,
        email,
        departmentId,
        role,
        status,
        profileImageURL,
      },
    });
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to update user', error: (error as any).message },
      { status: 500 }
    );
  }
}

// DELETE a user
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
     await prisma.$transaction(async (tx) => {
        await tx.activityLog.deleteMany({
            where: { userId: params.id }
        });
        await tx.user.delete({
            where: { id: params.id },
        });
    });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to delete not found
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to delete user', error: (error as any).message },
      { status: 500 }
    );
  }
}
