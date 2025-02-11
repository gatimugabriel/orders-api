/*
  Warnings:

  - A unique constraint covering the columns `[paymentID]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentID` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentID" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "orders_paymentID_key" ON "orders"("paymentID");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_paymentID_fkey" FOREIGN KEY ("paymentID") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
