
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET all team members, ordered by displayOrder
export async function GET() {
  try {
    const teamMembers = await prisma.teamMember.findMany({
      orderBy: {
        displayOrder: "asc",
      },
    });
    return NextResponse.json(teamMembers);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch team members", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// CREATE a new team member
export async function POST(request: Request) {
  const user = await getAuthFromRequest(request);
  if (!user || user.role !== 'Super Admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { name, role, bio, avatarUrl, isCeo, isVisible } = data;

    if (!name || !role || !bio) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Get the highest display order and add 1
    const lastMember = await prisma.teamMember.findFirst({
      orderBy: { displayOrder: "desc" },
    });
    const newDisplayOrder = (lastMember?.displayOrder ?? -1) + 1;

    const newMember = await prisma.teamMember.create({
      data: {
        name,
        role,
        bio,
        avatarUrl,
        isCeo,
        isVisible,
        displayOrder: newDisplayOrder,
      },
    });
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create team member", error: (error as Error).message },
      { status: 500 }
    );
  }
}
