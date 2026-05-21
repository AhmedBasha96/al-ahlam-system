-- AlterTable
ALTER TABLE `AccountRecord` ADD COLUMN `customerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `status` ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `Bank` ADD COLUMN `agencyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `defaultDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `defaultDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `pricingTier` VARCHAR(191) NULL DEFAULT 'RETAIL';

-- AlterTable
ALTER TABLE `TransactionItem` ADD COLUMN `originalPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `discountPercentage` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `sellUnit` VARCHAR(191) NULL DEFAULT 'PIECE',
    ADD COLUMN `unitQuantity` DECIMAL(65, 30) NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `AccountRecord` ADD CONSTRAINT `AccountRecord_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bank` ADD CONSTRAINT `Bank_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;


