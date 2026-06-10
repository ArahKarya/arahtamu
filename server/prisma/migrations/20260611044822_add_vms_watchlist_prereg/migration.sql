-- CreateEnum
CREATE TYPE "WatchlistLevel" AS ENUM ('WATCH', 'BLOCK');

-- CreateEnum
CREATE TYPE "PreregStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "id_number" TEXT,
    "reason" TEXT NOT NULL,
    "level" "WatchlistLevel" NOT NULL DEFAULT 'WATCH',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preregistrations" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "visitor_data" JSONB NOT NULL,
    "purpose" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "qr_token" TEXT NOT NULL,
    "status" "PreregStatus" NOT NULL DEFAULT 'PENDING',
    "visit_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preregistrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watchlists_phone_idx" ON "watchlists"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "preregistrations_qr_token_key" ON "preregistrations"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "preregistrations_visit_id_key" ON "preregistrations"("visit_id");

-- CreateIndex
CREATE INDEX "preregistrations_status_idx" ON "preregistrations"("status");

-- CreateIndex
CREATE INDEX "preregistrations_host_id_idx" ON "preregistrations"("host_id");

-- AddForeignKey
ALTER TABLE "preregistrations" ADD CONSTRAINT "preregistrations_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preregistrations" ADD CONSTRAINT "preregistrations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preregistrations" ADD CONSTRAINT "preregistrations_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

