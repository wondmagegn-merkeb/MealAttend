
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET site settings
export async function GET(request: Request) {
  try {
    const user = await getAuthFromRequest(request);
    if (user?.role !== 'Super Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      // If no settings exist, create them with defaults
      const defaultSettings = await prisma.siteSettings.create({
        data: { id: 1 }
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Failed to fetch site settings', error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE site settings
export async function PUT(request: Request) {
  try {
    const user = await getAuthFromRequest(request);
    if (user?.role !== 'Super Admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    const updatedSettings = await prisma.siteSettings.update({
      where: { id: 1 },
      data: {
        showFeaturesSection: data.showFeaturesSection,
        showTeamSection: data.showTeamSection,
        addisSparkLogoUrl: data.addisSparkLogoUrl,
        leoMaxwellPhotoUrl: data.leoMaxwellPhotoUrl,
        owenGrantPhotoUrl: data.owenGrantPhotoUrl,
        eleanorVancePhotoUrl: data.eleanorVancePhotoUrl,
        sofiaReyesPhotoUrl: data.sofiaReyesPhotoUrl,
        calebFinnPhotoUrl: data.calebFinnPhotoUrl,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    if ((error as any).code === 'P2025') { // Record to update not found
      return NextResponse.json({ message: 'Site settings not found.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to update site settings', error: error.message },
      { status: 500 }
    );
  }
}
