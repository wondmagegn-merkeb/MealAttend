import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { Student } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/students/[id] - Fetch a single student by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const student = await prisma.student.findUnique({
      where: { id },
    });
    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }
    return NextResponse.json(student, { status: 200 });
  } catch (error) {
    console.error(`Error fetching student with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch student', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/students/[id] - Update a student by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const body = await request.json();
    const { studentId, name, gender, classGrade, profileImageURL } = body as Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>;

    // Optional: Check if studentId is being changed and if the new one already exists
    if (studentId) {
        const existingStudentById = await prisma.student.findUnique({
            where: { studentId },
        });
        // If studentId exists and it's not for the current student we are updating
        if (existingStudentById && existingStudentById.id !== id) {
            return NextResponse.json({ message: `Another student with ID ${studentId} already exists.` }, { status: 409 });
        }
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        studentId,
        name,
        gender,
        classGrade,
        profileImageURL,
        updatedAt: new Date(), // Manually set updatedAt if not automatically handled by Prisma for all fields
      },
    });
    return NextResponse.json(updatedStudent, { status: 200 });
  } catch (error) {
    console.error(`Error updating student with id ${id}:`, error);
    if ((error as any).code === 'P2025') { // Prisma error code for record not found during update
        return NextResponse.json({ message: 'Student not found for update' }, { status: 404 });
    }
    if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('studentId')) {
        return NextResponse.json({ message: `Another student with ID ${ (error as any).meta?.values?.[0] } already exists.` }, { status: 409 });
    }
    return NextResponse.json({ message: 'Failed to update student', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/students/[id] - Delete a student by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    await prisma.student.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });
    // return new NextResponse(null, { status: 204 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting student with id ${id}:`, error);
     if ((error as any).code === 'P2025') { // Prisma error code for record not found during delete
        return NextResponse.json({ message: 'Student not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete student', error: (error as Error).message }, { status: 500 });
  }
}
