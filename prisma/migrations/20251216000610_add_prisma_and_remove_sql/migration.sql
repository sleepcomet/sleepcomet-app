-- CreateTable
CREATE TABLE "endpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'up',
    "uptime" DOUBLE PRECISION,
    "lastCheck" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_pages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "status" TEXT NOT NULL DEFAULT 'operational',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StatusPagesOnEndpoints" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "status_pages_slug_key" ON "status_pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "_StatusPagesOnEndpoints_AB_unique" ON "_StatusPagesOnEndpoints"("A", "B");

-- CreateIndex
CREATE INDEX "_StatusPagesOnEndpoints_B_index" ON "_StatusPagesOnEndpoints"("B");

-- AddForeignKey
ALTER TABLE "_StatusPagesOnEndpoints" ADD CONSTRAINT "_StatusPagesOnEndpoints_A_fkey" FOREIGN KEY ("A") REFERENCES "endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StatusPagesOnEndpoints" ADD CONSTRAINT "_StatusPagesOnEndpoints_B_fkey" FOREIGN KEY ("B") REFERENCES "status_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
