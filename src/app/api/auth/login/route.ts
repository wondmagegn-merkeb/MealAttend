
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, password: inputPassword } = await request.json();

    if (!email || !inputPassword) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: true },
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    // In a real app, you would compare hashed passwords.
    // For this demo, we compare plaintext passwords as stored in the seed data.
    const passwordMatches = user.password === inputPassword;

    if (!passwordMatches) {
        return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    // Don't send the password back to the client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'Login successful', user: userWithoutPassword }, { status: 200 });

  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
