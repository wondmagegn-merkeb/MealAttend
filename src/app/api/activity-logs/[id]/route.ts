
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import type { UserActivityLog } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/activity-logs/[id] - Fetch a single activity log by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const log = await prisma.userActivityLog.findUnique({
      where: { id },
    });
    if (!log) {
      return NextResponse.json({ message: 'Activity log not found' }, { status: 404 });
    }
    return NextResponse.json(log, { status: 200 });
  } catch (error) {
    console.error(`Error fetching activity log with id ${id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch activity log', error: (error as Error).message }, { status: 500 });
  }
}

// PUT /api/activity-logs/[id] - Update an activity log by ID
// Generally, activity logs are immutable. This endpoint might not be conventional.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    const body = await request.json() as Partial<Omit<UserActivityLog, 'id' | 'createdAt'>>;
    const { userIdentifier, action, details, activityTimestamp } = body;

    const updatedLog = await prisma.userActivityLog.update({
      where: { id },
      data: {
        userIdentifier,
        action,
        details,
        activityTimestamp: activityTimestamp ? new Date(activityTimestamp) : undefined,
      },
    });
    return NextResponse.json(updatedLog, { status: 200 });
  } catch (error) {
    console.error(`Error updating activity log with id ${id}:`, error);
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Activity log not found for update' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to update activity log', error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/activity-logs/[id] - Delete an activity log by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  try {
    await prisma.userActivityLog.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Activity log deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting activity log with id ${id}:`, error);
     if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Activity log not found for deletion' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Failed to delete activity log', error: (error as Error).message }, { status: 500 });
  }
}
