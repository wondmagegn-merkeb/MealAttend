
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { User } from '@prisma/client';

export const dynamic = 'force-dynamic';

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
  // Dynamically import dependencies only used in this POST handler
  const { generateWelcomeEmail } = await import('@/ai/flows/send-welcome-email-flow');
  const { Resend } = await import('resend');
  
  try {
    const body = await request.json();
    const { fullName, email, role, profileImageURL, departmentId } = body as Partial<User & { password?: string }>;

    if (!fullName || !email || !role) {
      return NextResponse.json({ message: 'Missing required fields: fullName, email, and role are required.' }, { status: 400 });
    }

    const department = departmentId ? await prisma.department.findUnique({ where: { id: departmentId } }) : null;
    if (departmentId && !department) {
        return NextResponse.json({ message: `Department with ID ${departmentId} not found.` }, { status: 400 });
    }

    const departmentNamePart = department ? department.name.toLowerCase().replace(/[^a-z0-9]/gi, '') : 'nodepartment';
    const tempPassword = `${role.toLowerCase()}@${departmentNamePart}123`;
    const passwordHash = `${tempPassword}-hashed`;

    const generatedUserId = await generateAderaUserId();

    const dataToCreate: any = {
      userId: generatedUserId,
      fullName,
      email,
      passwordHash,
      role,
      profileImageURL,
      passwordChangeRequired: true,
    };

    if (departmentId) {
      dataToCreate.department = { connect: { id: departmentId } };
    }

    const newUser = await prisma.user.create({
      data: dataToCreate,
      include: { department: true },
    });

    try {
      const emailContent = await generateWelcomeEmail({
        userName: newUser.fullName,
        userEmail: newUser.email,
        tempPassword: tempPassword,
        loginUrl: new URL('/auth/login', request.url).toString(),
      });

      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: newUser.email,
          subject: emailContent.subject,
          text: emailContent.body,
        });
        console.log(`Welcome email sent to ${newUser.email} via Resend.`);
      } else {
        console.warn("RESEND_API_KEY not set. Simulating email sending by logging to console.");
        console.log("------- WELCOME EMAIL (SIMULATED) -------");
        console.log(`To: ${newUser.email}`);
        console.log(`Subject: ${emailContent.subject}`);
        console.log(`Body:\n${emailContent.body}`);
        console.log("-----------------------------------------");
      }
    } catch (emailError) {
      console.error("Failed to generate or send welcome email:", emailError);
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
