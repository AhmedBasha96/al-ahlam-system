-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `status` ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `Bank` ADD COLUMN `agencyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TransactionItem` ADD COLUMN `originalPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `discountPercentage` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `Bank` ADD CONSTRAINT `Bank_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
