
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { hash } from 'bcryptjs';
import { getAuthFromRequest } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

const saltRounds = 10;
export const dynamic = 'force-dynamic';

// GET all users
export async function GET(request: Request) {
  try {
    const user = await getAuthFromRequest(request);

    if (!user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const whereClause: any = {};
    if (user.role === 'Admin' || user.role === 'User') {
      // Admins and Users can only see the users they created
      whereClause.createdById = user.id;
    }
    // Super Admins have no whereClause, so they see everyone.

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            userId: true,
            fullName: true,
          }
        }
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
    const creator = await getAuthFromRequest(request);
     if (!creator) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const data = await request.json();
    console.log(data)
    const { 
        fullName, email, position, role, status, profileImageURL, passwordChangeRequired, createdById,
        canReadDashboard, canScanId,
        canReadStudents, canWriteStudents, canCreateStudents, canDeleteStudents, canExportStudents,
        canReadAttendance, canExportAttendance,
        canReadActivityLog,
        canReadUsers, canWriteUsers,
        canManageSiteSettings
    } = data;

    if (!fullName || !email || !role || !status || !createdById) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Enforce role creation rules
    if (creator.role === 'Admin' && (role === 'Admin' || role === 'Super Admin')) {
        return NextResponse.json({ message: 'Admins cannot create other Admins.' }, { status: 403 });
    }
    if (creator.role === 'User') {
        return NextResponse.json({ message: 'Users cannot create other users.' }, { status: 403 });
    }

    const newUserId = await generateNextId('USER');

    const settings = await prisma.appSettings.findUnique({ where: { id: 1 }});
    const passwordToHash = 'password123'; // Fallback password
    let passwordForDb = '';

    if (role === 'User' && settings?.defaultUserPassword) {
      passwordForDb = settings.defaultUserPassword;
    } else if (role === 'Admin' && settings?.defaultAdminPassword) {
      passwordForDb = settings.defaultAdminPassword;
    } else if (role === 'Super Admin' && settings?.defaultSuperAdminPassword) {
      passwordForDb = settings.defaultSuperAdminPassword;
    }
    
    // If no default password is set in DB for the role, use and hash the fallback
    if (!passwordForDb) {
        passwordForDb = await hash(passwordToHash, saltRounds);
    }

    const newUser = await prisma.user.create({
      data: {
        userId: newUserId,
        fullName,
        email,
        password: passwordForDb,
        position,
        role,
        status,
        profileImageURL,
        passwordChangeRequired: passwordChangeRequired,
        createdById: createdById, // Use the ID passed from the frontend
        // Permissions
        canReadDashboard, canScanId,
        canReadStudents, canWriteStudents, canCreateStudents, canDeleteStudents, canExportStudents,
        canReadAttendance, canExportAttendance,
        canReadActivityLog,
        canReadUsers, canWriteUsers,
        canManageSiteSettings,
      },
    });
    
    // Send welcome email after successful creation
    try {
        await sendWelcomeEmail({
            fullName: newUser.fullName,
            email: newUser.email,
            loginUrl: `${new URL(request.url).origin}/auth/login`,
            siteName: settings?.siteName || 'MealAttend'
        });
    } catch(emailError) {
        console.error(`User ${newUser.userId} created, but failed to send welcome email:`, emailError);
        // Don't fail the entire request, but maybe log this for monitoring
    }

    // Don't return the password in the response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {

    console.log(error)
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
