
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { hash } from 'bcryptjs';

const saltRounds = 10;

interface RouteParams {
  params: {
    id: string; // This is the internal ID ('user_1'), not the ADERA ID
  };
}

// GET a single user
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { 
        createdBy: {
          select: { id: true, userId: true, fullName: true }
        }
       },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch user', error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE a user
export async function PUT(request: Request, { params }: RouteParams) {
  try {
     const editor = await getAuthFromRequest(request);
     if (!editor) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    
    const userToEdit = await prisma.user.findUnique({ where: { id: params.id } });
    if (!userToEdit) {
        return NextResponse.json({ message: 'User to edit not found' }, { status: 404 });
    }

    const data = await request.json();
    const { 
        fullName, email, position, role, status, profileImageURL, password, passwordChangeRequired,
        canReadDashboard, canScanId,
        canReadStudents, canWriteStudents, canCreateStudents, canDeleteStudents, canExportStudents,
        canReadAttendance, canExportAttendance,
        canReadActivityLog,
        canReadUsers, canWriteUsers,
        canManageSiteSettings,
        canSeeAllRecords
    } = data;
    
    // Authorization check
    if (editor.role !== 'Super Admin') {
        if (data.role === 'Admin' || data.role === 'Super Admin') {
            return NextResponse.json({ message: 'Only Super Admins can assign Admin roles.' }, { status: 403 });
        }
        if (userToEdit.role === 'Admin' || userToEdit.role === 'Super Admin') {
            return NextResponse.json({ message: 'Admins cannot edit other Admins or Super Admins.' }, { status: 403 });
        }
    }

    if (userToEdit.id === editor.id && userToEdit.role !== data.role) {
        return NextResponse.json({ message: 'You cannot change your own role.' }, { status: 403 });
    }

    const dataToUpdate: any = {
        fullName,
        position,
        role,
        status,
        profileImageURL,
        passwordChangeRequired,
        // Permissions
        canReadDashboard, canScanId,
        canReadStudents, canWriteStudents, canCreateStudents, canDeleteStudents, canExportStudents,
        canReadAttendance, canExportAttendance,
        canReadActivityLog,
        canReadUsers, canWriteUsers,
        canManageSiteSettings,
        canSeeAllRecords
    };
    
    // Only update email if it's different (and not for profile edit mode, though that's a different form)
    if (email && email !== userToEdit.email) {
      dataToUpdate.email = email;
    }

    if (password) {
        dataToUpdate.password = await hash(password, saltRounds);
        // passwordChangeRequired is already in the main dataToUpdate object from the form
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
     if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'A user with this email already exists.'}, { status: 409 });
    }
    return NextResponse.json(
      { message: 'Failed to update user', error: (error as any).message },
      { status: 500 }
    );
  }
}

// DELETE a user
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const editor = await getAuthFromRequest(request);
    if (!editor) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    if (editor.id === params.id) {
        return NextResponse.json({ message: 'You cannot delete your own account.' }, { status: 403 });
    }

     await prisma.$transaction(async (tx) => {
        // Delete related students first
        await tx.student.deleteMany({
            where: { createdById: params.id }
        });
        // Delete related activity logs
        await tx.activityLog.deleteMany({
            where: { userId: params.id }
        });
        // Finally, delete the user
        await tx.user.delete({
            where: { id: params.id },
        });
    });
    return NextResponse.json({ message: 'User and their created students deleted successfully' }, { status: 200 });
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to delete not found
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to delete user', error: (error as any).message },
      { status: 500 }
    );
  }
}
