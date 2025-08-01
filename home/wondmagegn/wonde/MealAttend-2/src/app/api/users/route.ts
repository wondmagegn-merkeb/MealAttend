
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { hash } from 'bcryptjs';
import { getAuthFromRequest } from '@/lib/auth';

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
    if (user.role === 'Admin') {
      // Admins can see the users they created
      whereClause.createdById = user.id;
    } else if (user.role === 'User') {
      // Users can only see themselves (or no one, depending on policy)
      whereClause.id = user.id;
    }
    // Super Admins have no whereClause, so they see everyone.

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        department: true, // Include related department data
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
    const { 
        fullName, email, departmentId, role, status, profileImageURL,
        canReadStudents, canWriteStudents, canCreateStudents, canDeleteStudents, canExportStudents,
        canReadAttendance, canExportAttendance,
        canReadActivityLog,
        canReadUsers, canWriteUsers,
        canReadDepartments, canWriteDepartments
    } = data;

    if (!fullName || !email || !departmentId || !role || !status) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Enforce role creation rules
    if (creator.role !== 'Super Admin' && role === 'Super Admin') {
        return NextResponse.json({ message: 'Only Super Admins can create other Super Admins.' }, { status: 403 });
    }
    if (creator.role === 'Admin' && role === 'Admin') {
        return NextResponse.json({ message: 'Admins cannot create other Admins.' }, { status: 403 });
    }
    if (creator.role === 'User') {
        return NextResponse.json({ message: 'Users cannot create other users.' }, { status: 403 });
    }

    const newUserId = await generateNextId('USER');

    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });
    
    let defaultPassword = 'password123'; // System-wide fallback
    if (role === 'Super Admin' && siteSettings?.defaultSuperAdminPassword) {
      defaultPassword = siteSettings.defaultSuperAdminPassword;
    } else if (role === 'Admin' && siteSettings?.defaultAdminPassword) {
      defaultPassword = siteSettings.defaultAdminPassword;
    } else if (role === 'User' && siteSettings?.defaultUserPassword) {
      defaultPassword = siteSettings.defaultUserPassword;
    }

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
        createdById: creator.id,
        // Permissions
        canReadStudents, canWriteStudents, canCreateStudents, canDeleteStudents, canExportStudents,
        canReadAttendance, canExportAttendance,
        canReadActivityLog,
        canReadUsers, canWriteUsers,
        canReadDepartments, canWriteDepartments,
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

    