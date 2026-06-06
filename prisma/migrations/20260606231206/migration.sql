-- CreateEnum
CREATE TYPE "TemplateEngine" AS ENUM ('HANDLEBARS');

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "engine" "TemplateEngine" NOT NULL DEFAULT 'HANDLEBARS',
    "slots" JSONB NOT NULL,
    "schema" JSONB,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_versions" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "slots" JSONB NOT NULL,
    "schema" JSONB,
    "metadata" JSONB,
    "changedById" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_template_overrides" (
    "id" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slots" JSONB NOT NULL,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_template_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_template_override_versions" (
    "id" TEXT NOT NULL,
    "overrideId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "slots" JSONB NOT NULL,
    "metadata" JSONB,
    "changedById" TEXT,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_template_override_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "templates_key_key" ON "templates"("key");

-- CreateIndex
CREATE INDEX "template_versions_templateId_idx" ON "template_versions"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "template_versions_templateId_version_key" ON "template_versions"("templateId", "version");

-- CreateIndex
CREATE INDEX "org_template_overrides_organizationId_idx" ON "org_template_overrides"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "org_template_overrides_templateKey_organizationId_key" ON "org_template_overrides"("templateKey", "organizationId");

-- CreateIndex
CREATE INDEX "org_template_override_versions_overrideId_idx" ON "org_template_override_versions"("overrideId");

-- CreateIndex
CREATE UNIQUE INDEX "org_template_override_versions_overrideId_version_key" ON "org_template_override_versions"("overrideId", "version");

-- AddForeignKey
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_versions" ADD CONSTRAINT "template_versions_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_template_overrides" ADD CONSTRAINT "org_template_overrides_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_template_overrides" ADD CONSTRAINT "org_template_overrides_templateKey_fkey" FOREIGN KEY ("templateKey") REFERENCES "templates"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_template_override_versions" ADD CONSTRAINT "org_template_override_versions_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "org_template_override_versions" ADD CONSTRAINT "org_template_override_versions_overrideId_fkey" FOREIGN KEY ("overrideId") REFERENCES "org_template_overrides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
