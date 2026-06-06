-- CreateTable
CREATE TABLE "address_hierarchy" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "address_hierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "address_hierarchy_country_level_idx" ON "address_hierarchy"("country", "level");

-- CreateIndex
CREATE INDEX "address_hierarchy_parentId_idx" ON "address_hierarchy"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "address_hierarchy_country_code_key" ON "address_hierarchy"("country", "code");

-- AddForeignKey
ALTER TABLE "address_hierarchy" ADD CONSTRAINT "address_hierarchy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "address_hierarchy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
