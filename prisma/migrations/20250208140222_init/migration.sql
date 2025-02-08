-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'ONDELIVERY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'TIMEOUT', 'CANCELLED', 'INSUFFICIENTBALANCE', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentGatewayProvider" AS ENUM ('CARD', 'PAYPAL', 'CRYPTO');

-- CreateEnum
CREATE TYPE "TokenAction" AS ENUM ('AUTH', 'EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthSource" AS ENUM ('BASIC', 'GOOGLE', 'APPLE', 'META');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PROCESSING',
    "shippingAddress" TEXT,
    "deliveryMethod" TEXT NOT NULL,
    "userID" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderID" INTEGER NOT NULL,
    "productID" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "orderID" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PROCESSING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE',
    "paymentGatewayProvider" "PaymentGatewayProvider" NOT NULL DEFAULT 'CARD',
    "transactionReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "category" TEXT[],
    "brand" TEXT NOT NULL,
    "quantity" TEXT,
    "dimensions" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discountRate" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "orderID" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "action" "TokenAction" NOT NULL DEFAULT 'AUTH',
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "auth_source" "AuthSource" NOT NULL DEFAULT 'BASIC',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productID_fkey" FOREIGN KEY ("productID") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_orderID_fkey" FOREIGN KEY ("orderID") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userID_fkey" FOREIGN KEY ("userID") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
