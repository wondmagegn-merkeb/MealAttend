
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET site settings
export async function GET(request: Request) {
  try {
    // No auth check needed for public settings retrieval,
    // as it's used by the root layout.
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
    // Return a default-like structure on error to prevent layout crash
    console.error("Failed to fetch site settings:", error.message);
    return NextResponse.json({
        id: 1,
        siteName: 'MealAttend',
        headerContent: 'MealAttend Information Center',
        idPrefix: 'ADERA',
        theme: 'default',
        showFeaturesSection: true,
        showTeamSection: true,
        addisSparkLogoUrl: '',
        leoMaxwellPhotoUrl: '',
        owenGrantPhotoUrl: '',
        eleanorVancePhotoUrl: '',
        sofiaReyesPhotoUrl: '',
        calebFinnPhotoUrl: '',
        defaultAdminPassword: '',
        defaultUserPassword: '',
        idCardLogoUrl: '',
        idCardSchoolName: 'Tech University',
        idCardTitle: 'STUDENT ID',
    });
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
        siteName: data.siteName,
        headerContent: data.headerContent,
        idPrefix: data.idPrefix,
        theme: data.theme,
        showFeaturesSection: data.showFeaturesSection,
        showTeamSection: data.showTeamSection,
        addisSparkLogoUrl: data.addisSparkLogoUrl,
        leoMaxwellPhotoUrl: data.leoMaxwellPhotoUrl,
        owenGrantPhotoUrl: data.owenGrantPhotoUrl,
        eleanorVancePhotoUrl: data.eleanorVancePhotoUrl,
        sofiaReyesPhotoUrl: data.sofiaReyesPhotoUrl,
        calebFinnPhotoUrl: data.calebFinnPhotoUrl,
        defaultAdminPassword: data.defaultAdminPassword,
        defaultUserPassword: data.defaultUserPassword,
        idCardLogoUrl: data.idCardLogoUrl,
        idCardSchoolName: data.idCardSchoolName,
        idCardTitle: data.idCardTitle,
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
