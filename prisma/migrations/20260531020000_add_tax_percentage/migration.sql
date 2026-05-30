-- AlterTable
ALTER TABLE `TransactionItem` ADD COLUMN `taxPercentage` DECIMAL(65, 30) NOT NULL DEFAULT 0.00;
