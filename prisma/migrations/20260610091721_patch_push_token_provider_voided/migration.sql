/*
  Warnings:

  - You are about to drop the column `active` on the `push_tokens` table. All the data in the column will be lost.
  - Added the required column `provider` to the `push_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "push_tokens_userId_active_idx";

-- AlterTable
ALTER TABLE "push_tokens" DROP COLUMN "active",
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "voided" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "push_tokens_userId_voided_idx" ON "push_tokens"("userId", "voided");
