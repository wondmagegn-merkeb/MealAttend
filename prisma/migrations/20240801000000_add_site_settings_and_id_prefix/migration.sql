
-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" SERIAL NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'MealAttend',
    "headerContent" TEXT NOT NULL DEFAULT 'MealAttend Information Center',
    "idPrefix" TEXT NOT NULL DEFAULT 'ADERA',
    "theme" TEXT NOT NULL DEFAULT 'default',
    "showFeaturesSection" BOOLEAN NOT NULL DEFAULT true,
    "showTeamSection" BOOLEAN NOT NULL DEFAULT true,
    "addisSparkLogoUrl" TEXT,
    "leoMaxwellPhotoUrl" TEXT,
    "owenGrantPhotoUrl" TEXT,
    "eleanorVancePhotoUrl" TEXT,
    "sofiaReyesPhotoUrl" TEXT,
    "calebFinnPhotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- Insert default settings row
INSERT INTO "SiteSettings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
