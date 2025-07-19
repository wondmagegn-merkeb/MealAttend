
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { hash } from 'bcryptjs';

const saltRounds = 10;
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string; // This is the internal ID ('user_...')
  };
}

// Handler for an admin resetting a user's password
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const editor = await getAuthFromRequest(request);
    if (!editor || (editor.role !== 'Admin' && editor.role !== 'Super Admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const userToReset = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!userToReset) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Authorization: Ensure Admins can only reset users they created, Super Admins can reset anyone
    if (editor.role === 'Admin' && userToReset.createdById !== editor.id) {
        return NextResponse.json({ message: 'You do not have permission to reset this user\'s password.' }, { status: 403 });
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
    let passwordToUse = 'password123'; // Fallback default password
    let passwordIsFromDb = false;

    // Determine which default password to use based on the user's role
    if (userToReset.role === 'User' && settings?.defaultUserPassword) {
      passwordIsFromDb = true;
    } else if (userToReset.role === 'Admin' && settings?.defaultAdminPassword) {
      passwordIsFromDb = true;
    } else if (userToReset.role === 'Super Admin' && settings?.defaultSuperAdminPassword) {
      passwordIsFromDb = true;
    }

    const hashedPassword = passwordIsFromDb
      ? userToReset.role === 'User' ? settings!.defaultUserPassword! 
      : userToReset.role === 'Admin' ? settings!.defaultAdminPassword! 
      : settings!.defaultSuperAdminPassword!
      : await hash(passwordToUse, saltRounds);

    await prisma.user.update({
      where: { id: params.id },
      data: {
        password: hashedPassword,
        passwordChangeRequired: true, // Force user to change this default password on next login
        passwordResetRequested: false, // Clear the request flag
      },
    });

    return NextResponse.json({ message: `Password for ${userToReset.fullName} has been reset.` });

  } catch (error: any) {
    console.error('Password Reset Error:', error);
    return NextResponse.json(
      { message: 'Failed to reset password', error: (error as Error).message },
      { status: 500 }
    );
  }
}
