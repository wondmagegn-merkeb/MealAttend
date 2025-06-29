
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET a single department by ID
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: params.id },
    });

    if (!department) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch department', error: error.message },
      { status: 500 }
    );
  }
}


// UPDATE a department
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const data = await request.json();
    const updatedDepartment = await prisma.department.update({
      where: { id: params.id },
      data: {
        name: data.name,
      },
    });
    return NextResponse.json(updatedDepartment);
  } catch (error: any) {
     if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to update department', error: (error as any).message },
      { status: 500 }
    );
  }
}


// DELETE a department
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Before deleting a department, check if any users are assigned to it.
    const usersInDepartment = await prisma.user.count({
      where: { departmentId: params.id },
    });

    if (usersInDepartment > 0) {
      return NextResponse.json(
        { message: `Cannot delete department. ${usersInDepartment} user(s) are currently assigned to it. Please reassign them first.` },
        { status: 409 } // Conflict
      );
    }
    
    await prisma.department.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
  } catch (error: any) {
     if ((error as any).code === 'P2025') { // Record to delete not found
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to delete department', error: (error as any).message },
      { status: 500 }
    );
  }
}
