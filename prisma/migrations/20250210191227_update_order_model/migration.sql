/*
  Warnings:

  - The values [PROCESSING,SHIPPING] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `orderID` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `orderID` on the `products` table. All the data in the column will be lost.
  - Added the required column `price_at_time` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `productID` on table `order_items` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `paymentID` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productID_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_orderID_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_orderID_fkey";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "price",
ADD COLUMN     "discount_rate_at_time" DOUBLE PRECISION,
ADD COLUMN     "price_at_time" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "productID" SET NOT NULL;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentID" INTEGER NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "orderID";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "orderID";

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_paymentID_fkey" FOREIGN KEY ("paymentID") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productID_fkey" FOREIGN KEY ("productID") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
