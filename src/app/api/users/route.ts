
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { generateWelcomeEmail } from '@/ai/flows/send-welcome-email-flow';

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
    const { fullName, email, role, profileImageURL, departmentId } = body as Partial<User & { password?: string }>;

    if (!fullName || !email || !role) {
      return NextResponse.json({ message: 'Missing required fields: fullName, email, and role are required.' }, { status: 400 });
    }

    const generatedUserId = await generateAderaUserId();
    const tempPassword = randomBytes(4).toString('hex'); // e.g., 'a1b2c3d4'
    
    // !! IMPORTANT: Hash the password before saving in a real app!!
    // Example: const passwordHash = await bcrypt.hash(tempPassword, 10);
    const passwordHash = tempPassword; // Replace with actual hashing

    const dataToCreate: any = {
      userId: generatedUserId,
      fullName,
      email,
      passwordHash,
      role,
      profileImageURL,
      passwordChangeRequired: true, // Force password change on first login
    };

    if (departmentId) {
      dataToCreate.department = { connect: { id: departmentId } };
    }

    const newUser = await prisma.user.create({
      data: dataToCreate,
      include: { department: true },
    });

    // Generate and "send" welcome email after user is created
    try {
      const emailContent = await generateWelcomeEmail({
        userName: newUser.fullName,
        userEmail: newUser.email,
        tempPassword: tempPassword,
        loginUrl: new URL('/auth/login', request.url).toString(), // Construct login URL
      });
      // In a real app, you would use a service like Nodemailer, Resend, or SendGrid here.
      // For this simulation, we log the content to the server console.
      console.log("------- WELCOME EMAIL (SIMULATED) -------");
      console.log(`To: ${newUser.email}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log("Body:");
      console.log(emailContent.body);
      console.log("-----------------------------------------");
    } catch (emailError) {
      console.error("Failed to generate welcome email content:", emailError);
      // Don't fail the whole request if email generation fails, but log it.
    }


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
