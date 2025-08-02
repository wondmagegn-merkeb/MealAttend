
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateNextId } from '@/lib/idGenerator';
import { getAuthFromRequest } from '@/lib/auth';

// GET all students
export async function GET(request: Request) {
  try {
    const user = await getAuthFromRequest(request);

    if (!user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const whereClause: any = {};
    // Super Admins and Admins with canSeeAllRecords see all students.
    // Standard users or Admins without the permission only see students they created.
    if (user.role === 'User' || (user.role === 'Admin' && !user.canSeeAllRecords)) {
      whereClause.createdById = user.id;
    }

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
    const { name, gender, classGrade, createdById } = data;

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
        profileImageURL: null, // Profile images are no longer set at creation
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
