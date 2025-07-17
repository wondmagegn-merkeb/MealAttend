
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthFromRequest } from '@/lib/auth';
import { hash } from 'bcryptjs';

const saltRounds = 10;
export const dynamic = 'force-dynamic';

// GET app settings
export async function GET(request: Request) {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    });
    if (!settings) {
      // This should ideally not happen if seeding is done correctly
      const defaultSettings = await prisma.appSettings.create({
        data: {
          id: 1,
          siteName: "MealAttend",
          idPrefix: "ADERA",
          schoolName: "Tech University",
          idCardTitle: "STUDENT ID",
          colorTheme: "default",
        }
      });
      return NextResponse.json(defaultSettings);
    }
    // Don't send password hashes to the client
    const { defaultUserPassword, defaultAdminPassword, ...clientSettings } = settings;
    return NextResponse.json(clientSettings);
  } catch (error: any) {
    console.error('Error fetching app settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch app settings', error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE app settings
export async function PUT(request: Request) {
  try {
    const user = await getAuthFromRequest(request);
    if (!user || user.role !== 'Super Admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { 
        siteName, 
        idPrefix, 
        schoolName,
        idCardTitle,
        colorTheme,
        showHomepage,
        showTeamSection,
        companyLogoUrl,
        idCardLogoUrl,
        defaultUserPassword,
        defaultAdminPassword,
    } = data;

    const dataToUpdate: any = {
      siteName,
      idPrefix,
      schoolName,
      idCardTitle,
      colorTheme,
      showHomepage,
      showTeamSection,
      companyLogoUrl,
      idCardLogoUrl,
    };
    
    if (defaultUserPassword) {
      dataToUpdate.defaultUserPassword = await hash(defaultUserPassword, saltRounds);
    }

    if (defaultAdminPassword) {
      dataToUpdate.defaultAdminPassword = await hash(defaultAdminPassword, saltRounds);
    }

    const updatedSettings = await prisma.appSettings.update({
      where: { id: 1 },
      data: dataToUpdate,
    });
    
    const { defaultUserPassword: _, defaultAdminPassword: __, ...clientSettings } = updatedSettings;

    return NextResponse.json(clientSettings);
  } catch (error: any) {
    if ((error as any).code === 'P2025') {
      return NextResponse.json({ message: 'App settings not found.' }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to update app settings', error: (error as any).message },
      { status: 500 }
    );
  }
}
