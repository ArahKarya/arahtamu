-- CreateEnum
CREATE TYPE "HostConfirmation" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "host_confirmation" "HostConfirmation" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "host_confirmed_at" TIMESTAMP(3),
ADD COLUMN     "host_note" TEXT;

