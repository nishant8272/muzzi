-- AlterTable
ALTER TABLE "public"."Stream" ADD COLUMN     "thumbnail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "title" TEXT NOT NULL DEFAULT '';
