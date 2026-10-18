CREATE TABLE "Notification" (
 id TEXT PRIMARY KEY,
 "recipientId" TEXT NOT NULL REFERENCES "User"(id),
 "eventKey" TEXT NOT NULL UNIQUE,
 message TEXT NOT NULL,
 path TEXT NOT NULL,
 "readAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Notification_recipientId_readAt_idx" ON "Notification"("recipientId","readAt");
