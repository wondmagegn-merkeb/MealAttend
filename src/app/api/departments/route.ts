
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';

export const dynamic = 'force-dynamic';

// GET all departments
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(departments);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch departments', error: error.message },
      { status: 500 }
    );
  }
}

// CREATE a new department
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ message: 'Missing required field: name' }, { status: 400 });
    }

    const newDepartmentId = await generateNextId('DEPARTMENT');

    const newDepartment = await prisma.department.create({
      data: {
        id: newDepartmentId,
        name: data.name,
      },
    });
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error: any) {
     if ((error as any).code === 'P2002') {
       return NextResponse.json(
        { message: 'A department with this name already exists.', error: (error as any).message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create department', error: (error as any).message },
      { status: 500 }
    );
  }
}
