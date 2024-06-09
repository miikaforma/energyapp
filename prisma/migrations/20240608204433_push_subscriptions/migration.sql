-- CreateTable
CREATE TABLE "userPushSubscription" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "spotPrices" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "userPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "userPushSubscription_endpoint_idx" ON "userPushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "userPushSubscription" ADD CONSTRAINT "userPushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
