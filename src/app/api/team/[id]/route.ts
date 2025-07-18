
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// UPDATE a team member
export async function PUT(request: Request, { params }: RouteParams) {
  const user = await getAuthFromRequest(request);
  if (!user || user.role !== 'Super Admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const data = await request.json();
    const { name, role, bio, avatarUrl, isCeo, isVisible } = data;

    const updatedMember = await prisma.teamMember.update({
      where: { id: params.id },
      data: { name, role, bio, avatarUrl, isCeo, isVisible },
    });
    return NextResponse.json(updatedMember);
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json({ message: "Team member not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Failed to update team member", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE a team member
export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getAuthFromRequest(request);
  if (!user || user.role !== 'Super Admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    await prisma.teamMember.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Team member deleted" }, { status: 200 });
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json({ message: "Team member not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Failed to delete team member", error: (error as Error).message },
      { status: 500 }
    );
  }
}
