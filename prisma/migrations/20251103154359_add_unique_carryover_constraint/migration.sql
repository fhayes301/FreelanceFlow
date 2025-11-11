/*
  Warnings:

  - A unique constraint covering the columns `[month,carriedOverFromId]` on the table `Bill` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bill_month_carriedOverFromId_key" ON "Bill"("month", "carriedOverFromId");
