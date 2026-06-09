-- CreateEnum
CREATE TYPE "SettingScope" AS ENUM ('SYSTEM', 'ORGANIZATION', 'USER');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'BOOLEAN', 'INTEGER', 'FLOAT', 'JSON', 'ENCRYPTED');

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "scope" "SettingScope" NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "value" TEXT NOT NULL,
    "valueType" "SettingType" NOT NULL DEFAULT 'STRING',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "settings_scope_namespace_idx" ON "settings"("scope", "namespace");

-- CreateIndex
CREATE INDEX "settings_organizationId_idx" ON "settings"("organizationId");

-- CreateIndex
CREATE INDEX "settings_userId_idx" ON "settings"("userId");

-- CreateIndex
CREATE INDEX "settings_deletedAt_idx" ON "settings"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "settings_scope_namespace_key_userId_organizationId_key" ON "settings"("scope", "namespace", "key", "userId", "organizationId");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
