/*
  Warnings:

  - The values [CARD,CRYPTO] on the enum `PaymentGatewayProvider` will be removed. If these variants are still used in the database, this will fail.
  - The values [ONLINE,ONDELIVERY] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ONLINE', 'ONDELIVERY');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentGatewayProvider_new" AS ENUM ('STRIPE', 'PAYPAL', 'HELCIM');
ALTER TABLE "payments" ALTER COLUMN "paymentGatewayProvider" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "paymentGatewayProvider" TYPE "PaymentGatewayProvider_new" USING ("paymentGatewayProvider"::text::"PaymentGatewayProvider_new");
ALTER TYPE "PaymentGatewayProvider" RENAME TO "PaymentGatewayProvider_old";
ALTER TYPE "PaymentGatewayProvider_new" RENAME TO "PaymentGatewayProvider";
DROP TYPE "PaymentGatewayProvider_old";
ALTER TABLE "payments" ALTER COLUMN "paymentGatewayProvider" SET DEFAULT 'STRIPE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CARD', 'PAYPAL', 'CRYPTO');
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
ALTER TABLE "payments" ALTER COLUMN "paymentMethod" SET DEFAULT 'CARD';
COMMIT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "paymentMode" "PaymentMode" NOT NULL DEFAULT 'ONLINE',
ALTER COLUMN "paymentMethod" SET DEFAULT 'CARD',
ALTER COLUMN "paymentGatewayProvider" SET DEFAULT 'STRIPE';
