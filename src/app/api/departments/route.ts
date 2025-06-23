import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all departments
export async function GET(request: Request) {
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
    
    if (!data.id || !data.name) {
      return NextResponse.json(
        { message: 'Missing required fields: id and name' },
        { status: 400 }
      );
    }

    const newDepartment = await prisma.department.create({
      data: {
        id: data.id,
        name: data.name,
      },
    });
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error: any) {
     if ((error as any).code === 'P2002') {
       return NextResponse.json(
        { message: 'A department with this ID or name already exists.', error: (error as any).message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create department', error: (error as any).message },
      { status: 500 }
    );
  }
}
