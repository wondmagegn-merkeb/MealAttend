
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { User, Role } from '@prisma/client';

interface RouteParams {
  params: {
    id: string; // This will be the Prisma internal ID (cuid)
  };
}

// GET /api/users/[id] - Fetch a single user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a user by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const body = await request.json() as Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & { password?: string }>;
    const { userId, fullName, email, password, role, profileImageURL, departmentId, passwordChangeRequired } = body;

    const dataToUpdate: any = {
        userId,
        fullName,
        email,
        role: role as Role,
        profileImageURL,
        passwordChangeRequired,
    };

    if (password) {
      // !! IMPORTANT: Hash the password before saving !!
      // Example: dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
      dataToUpdate.passwordHash = password; // Replace with actual hashing
    }

    if (departmentId === null) { // Explicitly setting department to null
        dataToUpdate.department = {
            disconnect: true,
        };
    } else if (departmentId) { // Connecting to a new or existing department
        dataToUpdate.department = {
            connect: { id: departmentId },
        };
    }
    // If departmentId is undefined, we don't touch the relation.

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: { department: true },
    });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error(`Error updating user with id ${id}:`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'User not found for update' }, { status: 404 });
    }
    if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target as string[] | undefined;
        if (target?.includes('userId')) {
            return NextResponse.json({ message: `User with User ID '${userId}' already exists.` }, { status: 409 });
        }
        if (target?.includes('email')) {
             return NextResponse.json({ message: `User with email '${email}' already exists.` }, { status: 409 });
        }
    }
    return NextResponse.json({ message: 'Failed to update user', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a user by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting user with id ${id}:`, error);
     if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'User not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete user', error: (error as Error).message }, { status: 500 });
  }
}
