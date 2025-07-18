
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// UPDATE a feature
export async function PUT(request: Request, { params }: RouteParams) {
  const user = await getAuthFromRequest(request);
  if (!user || user.role !== 'Super Admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const data = await request.json();
    const { icon, title, description, isVisible } = data;

    const updatedFeature = await prisma.homepageFeature.update({
      where: { id: params.id },
      data: { icon, title, description, isVisible },
    });
    return NextResponse.json(updatedFeature);
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Failed to update feature", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE a feature
export async function DELETE(request: Request, { params }: RouteParams) {
  const user = await getAuthFromRequest(request);
  if (!user || user.role !== 'Super Admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    await prisma.homepageFeature.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: "Feature deleted" }, { status: 200 });
  } catch (error) {
    if ((error as any).code === "P2025") {
      return NextResponse.json({ message: "Feature not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Failed to delete feature", error: (error as Error).message },
      { status: 500 }
    );
  }
}
