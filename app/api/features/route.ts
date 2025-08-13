
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

// GET all features, ordered by displayOrder
export async function GET() {
  try {
    const features = await prisma.homepageFeature.findMany({
      orderBy: {
        displayOrder: "asc",
      },
    });
    return NextResponse.json(features);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch features", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// CREATE a new feature
export async function POST(request: Request) {
  const user = await getAuthFromRequest(request);
  if (!user || user.role !== 'Super Admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { icon, title, description, isVisible } = data;

    if (!icon || !title || !description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const lastFeature = await prisma.homepageFeature.findFirst({
      orderBy: { displayOrder: "desc" },
    });
    const newDisplayOrder = (lastFeature?.displayOrder ?? -1) + 1;

    const newFeature = await prisma.homepageFeature.create({
      data: {
        icon,
        title,
        description,
        isVisible,
        displayOrder: newDisplayOrder,
      },
    });
    return NextResponse.json(newFeature, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create feature", error: (error as Error).message },
      { status: 500 }
    );
  }
}
