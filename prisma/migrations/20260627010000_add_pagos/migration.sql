-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'ABONADO', 'PAGADO');

-- AlterTable
ALTER TABLE "Orden" ADD COLUMN "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE';

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodo" TEXT,
    "nota" TEXT,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "Orden"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
