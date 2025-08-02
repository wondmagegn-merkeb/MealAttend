
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

// GET all activity logs
export async function GET(request: Request) {
  try {
    const user = await getAuthFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const where: any = {};
    // Standard users only see their own activity log.
    // Admins only see their own unless they have the canSeeAllRecords permission.
    if (user.role === 'User' || (user.role === 'Admin' && !user.canSeeAllRecords)) {
      where.userIdentifier = user.userId;
    }
    // Super Admins and Admins with canSeeAllRecords have no 'where' clause, so they see all logs.

    const activityLogs = await prisma.activityLog.findMany({
      where,
      orderBy: {
        activityTimestamp: 'desc',
      },
    });
    return NextResponse.json(activityLogs);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch activity logs', error: error.message },
      { status: 500 }
    );
  }
}
