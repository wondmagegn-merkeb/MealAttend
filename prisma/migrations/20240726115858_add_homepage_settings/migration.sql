-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "companyLogoUrl" TEXT,
ADD COLUMN     "showHomepage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showTeamSection" BOOLEAN NOT NULL DEFAULT true;
