
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { Department } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/departments/[id] - Fetch a single department by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const department = await prisma.department.findUnique({
      where: { id },
    });
    if (!department) {
      return NextResponse.json({ message: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json(department, { status: 200 });
  } catch (error) {
    console.error(`Error fetching department with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch department', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/departments/[id] - Update a department by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const body = await request.json() as Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>;
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'Missing required field: name is required for update.' }, { status: 400 });
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: {
        name,
      },
    });
    return NextResponse.json(updatedDepartment, { status: 200 });
  } catch (error) {
    console.error(`Error updating department with id ${id}:`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Department not found for update' }, { status: 404 });
    }
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('name')) {
        return NextResponse.json({ message: `Department with name '${ (error as any).meta?.modelName }' already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update department', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/departments/[id] - Delete a department by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    // Consider implications: what happens to users in this department?
    // Prisma schema's `onDelete: SetNull` for User.departmentId will handle this.
    await prisma.department.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Department deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting department with id ${id}:`, error);
     if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Department not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete department', error: (error as Error).message }, { status: 500 });
  }
}
