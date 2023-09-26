/*
  Warnings:

  - You are about to drop the column `rentHistoryId` on the `Book` table. All the data in the column will be lost.
  - Added the required column `bookId` to the `RentHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Book" DROP CONSTRAINT "Book_rentHistoryId_fkey";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "rentHistoryId";

-- AlterTable
ALTER TABLE "RentHistory" ADD COLUMN     "bookId" TEXT NOT NULL;
