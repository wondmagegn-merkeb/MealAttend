
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { Department } from '@prisma/client';

// GET /api/departments - Fetch all departments
export async function GET(request: NextRequest) {
  try {
    const departments = await prisma.department.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(departments, { status: 200 });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ message: 'Failed to fetch departments', error: (error as Error).message }, { status: 500 });
  }
}

// POST /api/departments - Create a new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>;
    const { name } = body;

    if (!name) {
      return NextResponse.json({ message: 'Missing required field: name is required.' }, { status: 400 });
    }

    const newDepartment = await prisma.department.create({
      data: {
        name,
      },
    });
    return NextResponse.json(newDepartment, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('name')) {
        return NextResponse.json({ message: `Department with name '${ (error as any).meta?.modelName }' already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to create department', error: (error as Error).message }, { status: 500 });
  }
}
