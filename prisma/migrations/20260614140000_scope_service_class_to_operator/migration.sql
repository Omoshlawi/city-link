-- Clear existing seed/test data — service classes are now operator-scoped
-- and existing global rows have no organizationId to assign.
DELETE FROM "service_classes";

-- Drop old global unique constraints
DROP INDEX IF EXISTS "service_classes_code_key";
DROP INDEX IF EXISTS "service_classes_name_key";

-- Add organizationId column (NOT NULL — safe because table is now empty)
ALTER TABLE "service_classes" ADD COLUMN "organizationId" TEXT NOT NULL;

-- Add foreign key to organization
ALTER TABLE "service_classes" ADD CONSTRAINT "service_classes_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add per-operator unique constraints
CREATE UNIQUE INDEX "service_classes_code_organizationId_key" ON "service_classes"("code", "organizationId");
CREATE UNIQUE INDEX "service_classes_name_organizationId_key" ON "service_classes"("name", "organizationId");

-- Add index for org-scoped lookups
CREATE INDEX "service_classes_organizationId_idx" ON "service_classes"("organizationId");
