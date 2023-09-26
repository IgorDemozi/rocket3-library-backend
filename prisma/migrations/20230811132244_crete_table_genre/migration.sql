-- AlterTable
ALTER TABLE "Book" ALTER COLUMN "statusDescription" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "RentHistory" ALTER COLUMN "deliveryDate" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Genre" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("name")
);

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_genre_fkey" FOREIGN KEY ("genre") REFERENCES "Genre"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
