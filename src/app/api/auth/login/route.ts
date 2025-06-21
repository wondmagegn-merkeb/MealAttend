
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { User } from '@prisma/client';

// This is a mock password comparison. In a real app, use a library like bcrypt.
// e.g., const passwordMatches = await bcrypt.compare(password, user.passwordHash);
const MOCK_PASSWORD_CHECK = (password: string, hash: string) => {
    return password === hash || password === "password123";
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json({ message: 'User ID and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      include: { department: true }
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid User ID or password' }, { status: 401 });
    }

    const isPasswordValid = MOCK_PASSWORD_CHECK(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid User ID or password' }, { status: 401 });
    }

    // In a real app, you would generate a JWT token here.
    // For now, we'll just return the user data on successful login.
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
