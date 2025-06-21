
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { User } from '@prisma/client';

async function generateAderaUserId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const countForYear = await prisma.user.count({
    where: {
      userId: { startsWith: `ADERA/USR/${currentYear}/` },
    },
  });
  const serialNumber = (countForYear + 1).toString().padStart(5, '0');
  return `ADERA/USR/${currentYear}/${serialNumber}`;
}

// GET /api/users - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { department: true },
    });
    const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
    return NextResponse.json(usersWithoutPasswords, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password, role, profileImageURL, departmentId, passwordChangeRequired } = body as Partial<User & { password?: string }>;

    if (!fullName || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields: fullName, email, password, and role are required.' }, { status: 400 });
    }

    const generatedUserId = await generateAderaUserId();
    
    // !! IMPORTANT: Hash the password before saving !!
    // Example: const passwordHash = await bcrypt.hash(password, 10);
    const passwordHash = password; // Replace with actual hashing

    const dataToCreate: any = {
      userId: generatedUserId,
      fullName,
      email,
      passwordHash,
      role,
      profileImageURL,
      passwordChangeRequired: passwordChangeRequired ?? false,
    };

    if (departmentId) {
      dataToCreate.department = { connect: { id: departmentId } };
    }

    const newUser = await prisma.user.create({
      data: dataToCreate,
      include: { department: true },
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target as string[] | undefined;
        if (target?.includes('userId')) return NextResponse.json({ message: 'User ID already exists. Please try again.' }, { status: 409 });
        if (target?.includes('email')) return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create user', error: (error as Error).message }, { status: 500 });
  }
}
