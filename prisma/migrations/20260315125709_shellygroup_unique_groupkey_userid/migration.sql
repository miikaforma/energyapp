-- CreateTable
CREATE TABLE "shellyGroup" (
    "id" SERIAL NOT NULL,
    "groupKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "shellyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_serviceAccessToshellyGroup" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_serviceAccessToshellyGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "shellyGroup_groupKey_userId_key" ON "shellyGroup"("groupKey", "userId");

-- CreateIndex
CREATE INDEX "_serviceAccessToshellyGroup_B_index" ON "_serviceAccessToshellyGroup"("B");

-- AddForeignKey
ALTER TABLE "shellyGroup" ADD CONSTRAINT "shellyGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_serviceAccessToshellyGroup" ADD CONSTRAINT "_serviceAccessToshellyGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "serviceAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_serviceAccessToshellyGroup" ADD CONSTRAINT "_serviceAccessToshellyGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "shellyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
