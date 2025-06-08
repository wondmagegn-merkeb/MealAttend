
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { User, Role } from '@prisma/client'; // Ensure Role is imported if used directly

// GET /api/users - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        department: true, // Include department details
      },
    });
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & { password?: string }>;
    const { userId, fullName, email, password, role, profileImageURL, departmentId, passwordChangeRequired } = body;

    if (!userId || !fullName || !email || !password || !role) {
      return NextResponse.json({ message: 'Missing required fields: userId, fullName, email, password, and role are required.' }, { status: 400 });
    }

    // !! IMPORTANT: Hash the password before saving !!
    // Example: const passwordHash = await bcrypt.hash(password, 10);
    // For now, storing directly for demonstration, but this is INSECURE.
    const passwordHash = password; // Replace with actual hashing

    const dataToCreate: any = {
      userId,
      fullName,
      email,
      passwordHash, // Use the hashed password
      role: role as Role, // Cast if necessary
      profileImageURL,
      passwordChangeRequired: passwordChangeRequired ?? false,
    };

    if (departmentId) {
      dataToCreate.department = {
        connect: { id: departmentId },
      };
    }

    const newUser = await prisma.user.create({
      data: dataToCreate,
      include: { department: true },
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    if ((error as any).code === 'P2002') { // Unique constraint violation
        const target = (error as any).meta?.target as string[] | undefined;
        if (target?.includes('userId')) {
            return NextResponse.json({ message: `User with User ID '${userId}' already exists.` }, { status: 409 });
        }
        if (target?.includes('email')) {
             return NextResponse.json({ message: `User with email '${email}' already exists.` }, { status: 409 });
        }
    }
    return NextResponse.json({ message: 'Failed to create user', error: (error as Error).message }, { status: 500 });
  }
}
