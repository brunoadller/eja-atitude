/*
  Warnings:

  - Made the column `numero_prova` on table `notas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "notas" ALTER COLUMN "numero_prova" SET NOT NULL;
