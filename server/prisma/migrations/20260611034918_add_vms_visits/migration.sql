-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('PREREGISTERED', 'CHECKED_IN', 'CHECKED_OUT', 'DENIED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "user_id" TEXT;

-- CreateTable
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "id_number" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,
    "purpose" TEXT,
    "status" "VisitStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "check_in_at" TIMESTAMP(3),
    "check_out_at" TIMESTAMP(3),
    "photo_url" TEXT,
    "signature_url" TEXT,
    "badge_code" TEXT,
    "form_data" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visitors_phone_idx" ON "visitors"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "visits_badge_code_key" ON "visits"("badge_code");

-- CreateIndex
CREATE INDEX "visits_status_idx" ON "visits"("status");

-- CreateIndex
CREATE INDEX "visits_host_id_idx" ON "visits"("host_id");

-- CreateIndex
CREATE INDEX "visits_location_id_idx" ON "visits"("location_id");

-- CreateIndex
CREATE UNIQUE INDEX "hosts_user_id_key" ON "hosts"("user_id");

-- AddForeignKey
ALTER TABLE "hosts" ADD CONSTRAINT "hosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_visitor_id_fkey" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

