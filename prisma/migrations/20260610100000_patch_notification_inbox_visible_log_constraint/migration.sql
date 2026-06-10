-- Remove IN_APP from NotificationChannel enum (no rows exist yet, safe to recreate)
ALTER TYPE "NotificationChannel" RENAME TO "NotificationChannel_old";
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'SMS');
ALTER TABLE "notification_logs" ALTER COLUMN "channel" TYPE "NotificationChannel" USING "channel"::text::"NotificationChannel";
DROP TYPE "NotificationChannel_old";

-- Drop old unique constraint (dispatchId, channel, attemptNumber)
DROP INDEX "notification_logs_dispatchId_channel_attemptNumber_key";

-- Add recipientRef to unique constraint to support push fan-out (one row per token per attempt)
CREATE UNIQUE INDEX "notification_logs_dispatchId_channel_recipientRef_attemptNumber_key" ON "notification_logs"("dispatchId", "channel", "recipientRef", "attemptNumber");

-- Add visible flag to notification_inbox (false = hidden from user feed)
ALTER TABLE "notification_inbox" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;

-- Index for user feed queries (always filter visible=true)
CREATE INDEX "notification_inbox_userId_visible_createdAt_idx" ON "notification_inbox"("userId", "visible", "createdAt");
