
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';

export const dynamic = 'force-dynamic';

// GET all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true, // Include related department data
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
}

// CREATE a new user
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { fullName, email, departmentId, role, status, profileImageURL } = data;

    if (!fullName || !email || !departmentId || !role || !status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const newUserId = await generateNextId('USER');

    const newUser = await prisma.user.create({
      data: {
        userId: newUserId,
        fullName,
        email,
        departmentId,
        role,
        status,
        profileImageURL,
        passwordChangeRequired: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { message: 'A user with this email or ID already exists.', error: (error as any).message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create user', error: (error as any).message },
      { status: 500 }
    );
  }
}
