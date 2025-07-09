
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { hash } from 'bcrypt';

const saltRounds = 10;
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
    // Don't return passwords in the list
    const usersWithoutPasswords = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    })
    return NextResponse.json(usersWithoutPasswords);
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

    // Default password for new users.
    const defaultPassword = 'password123';
    const hashedPassword = await hash(defaultPassword, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        userId: newUserId,
        fullName,
        email,
        password: hashedPassword,
        departmentId,
        role,
        status,
        profileImageURL,
        passwordChangeRequired: true,
      },
    });

    // Don't return the password in the response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
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
