-- AlterTable
ALTER TABLE `JournalEntry` ADD COLUMN `status` ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'CONFIRMED',
    ADD COLUMN `confirmedAt` DATETIME(3) NULL,
    ADD COLUMN `confirmedBy` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `AccountRecord` ADD COLUMN `customerId` VARCHAR(191) NULL,
    ADD COLUMN `supplierId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `wholesaleDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `retailDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `supplierId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `status` ENUM('ACTIVE', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `Bank` ADD COLUMN `agencyId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TransactionItem` ADD COLUMN `originalPrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `discountPercentage` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE `AccountRecord` ADD CONSTRAINT `AccountRecord_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AccountRecord` ADD CONSTRAINT `AccountRecord_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bank` ADD CONSTRAINT `Bank_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
