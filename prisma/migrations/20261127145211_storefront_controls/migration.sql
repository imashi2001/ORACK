-- AlterTable
ALTER TABLE "BusinessSetting" ADD COLUMN     "seasonal" JSONB;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "tagline" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" INTEGER;

-- CreateTable
CREATE TABLE "SiteImage" (
    "slot" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteImage_pkey" PRIMARY KEY ("slot")
);
