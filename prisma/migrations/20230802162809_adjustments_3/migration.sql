-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "statusDescription" SET DEFAULT '';

-- AlterTable
ALTER TABLE "RentHistory" ALTER COLUMN "deliveryDate" SET DEFAULT CURRENT_DATE + 30;
