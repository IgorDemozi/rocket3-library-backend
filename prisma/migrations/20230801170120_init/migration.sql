-- CreateTable
CREATE TABLE "User" (
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "systemEntryDate" TIMESTAMP(3) NOT NULL,
    "synopsis" TEXT NOT NULL,
    "isRented" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "statusDescription" TEXT NOT NULL,
    "rentHistoryId" TEXT NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentHistory" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "withdrawalDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_rentHistoryId_fkey" FOREIGN KEY ("rentHistoryId") REFERENCES "RentHistory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
