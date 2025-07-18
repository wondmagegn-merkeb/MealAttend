
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 'Super Admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { orderedIds } = await request.json();
        if (!Array.isArray(orderedIds)) {
            return NextResponse.json({ message: 'Invalid payload, expected orderedIds array' }, { status: 400 });
        }

        const transactions = orderedIds.map((id, index) =>
            prisma.homepageFeature.update({
                where: { id },
                data: { displayOrder: index },
            })
        );

        await prisma.$transaction(transactions);

        return NextResponse.json({ message: 'Reorder successful' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to reorder features', error: (error as Error).message }, { status: 500 });
    }
}
