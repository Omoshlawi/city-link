-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH', 'SMS', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "platform" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "recipientId" TEXT,
    "recipientRef" TEXT NOT NULL,
    "organizationId" TEXT,
    "subject" TEXT,
    "body" TEXT,
    "jobId" TEXT,
    "error" TEXT,
    "providerMeta" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_inbox" (
    "id" TEXT NOT NULL,
    "dispatchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "templateKey" TEXT,
    "internalNote" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_userId_active_idx" ON "push_tokens"("userId", "active");

-- CreateIndex
CREATE INDEX "notification_logs_dispatchId_channel_idx" ON "notification_logs"("dispatchId", "channel");

-- CreateIndex
CREATE INDEX "notification_logs_provider_status_idx" ON "notification_logs"("provider", "status");

-- CreateIndex
CREATE INDEX "notification_logs_recipientId_idx" ON "notification_logs"("recipientId");

-- CreateIndex
CREATE INDEX "notification_logs_organizationId_idx" ON "notification_logs"("organizationId");

-- CreateIndex
CREATE INDEX "notification_logs_templateKey_channel_idx" ON "notification_logs"("templateKey", "channel");

-- CreateIndex
CREATE INDEX "notification_logs_status_createdAt_idx" ON "notification_logs"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_logs_dispatchId_channel_attemptNumber_key" ON "notification_logs"("dispatchId", "channel", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "notification_inbox_dispatchId_key" ON "notification_inbox"("dispatchId");

-- CreateIndex
CREATE INDEX "notification_inbox_userId_read_idx" ON "notification_inbox"("userId", "read");

-- CreateIndex
CREATE INDEX "notification_inbox_userId_createdAt_idx" ON "notification_inbox"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_inbox_organizationId_idx" ON "notification_inbox"("organizationId");

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox" ADD CONSTRAINT "notification_inbox_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_inbox" ADD CONSTRAINT "notification_inbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
