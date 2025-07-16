
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all students
export async function GET(request: Request) {
  try {
    const user = await getAuthFromRequest(request);
    if (!user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const whereClause: any = {};
    if (user.role === 'Admin') {
      whereClause.createdById = user.id;
    } else if (user.role === 'User') {
      whereClause.createdById = user.id;
    }
    // Super Admin has no 'where' clause, so they get all students

    const students = await prisma.student.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
       include: {
        createdBy: {
          select: {
            id: true,
            userId: true,
            fullName: true,
          }
        },
      }
    });
    return NextResponse.json(students);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch students', error: error.message },
      { status: 500 }
    );
  }
}

// CREATE a new student
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, gender, classGrade, profileImageURL, createdById } = data;

    if (!name || !createdById) {
      return NextResponse.json({ message: 'Missing required fields: name, createdById' }, { status: 400 });
    }

    const newStudentId = await generateNextId('STUDENT');

    const newStudent = await prisma.student.create({
      data: {
        studentId: newStudentId,
        name,
        gender,
        classGrade,
        profileImageURL,
        createdById,
        // The QR code data can be the studentId itself or some other unique identifier.
        qrCodeData: newStudentId,
      },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error: any) {
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { message: 'A student with this ID already exists.', error: (error as any).message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create student', error: (error as any).message },
      { status: 500 }
    );
  }
}
