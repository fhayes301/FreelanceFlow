-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "carriedOver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "carriedOverFromId" TEXT;

-- AlterTable
ALTER TABLE "BillTemplate" ADD COLUMN     "bankAccountDefault" TEXT;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_carriedOverFromId_fkey" FOREIGN KEY ("carriedOverFromId") REFERENCES "Bill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
