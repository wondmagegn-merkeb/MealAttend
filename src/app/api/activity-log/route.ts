
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all activity logs
export async function GET() {
  try {
    const activityLogs = await prisma.activityLog.findMany({
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
