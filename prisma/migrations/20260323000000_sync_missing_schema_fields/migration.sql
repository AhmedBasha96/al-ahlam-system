-- AlterTable
ALTER TABLE `Product` ADD COLUMN `wholesaleDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `retailDiscount` DECIMAL(65, 30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `JournalEntry` ADD COLUMN `status` ENUM('PENDING', 'CONFIRMED', 'REJECTED') NOT NULL DEFAULT 'CONFIRMED',
    ADD COLUMN `confirmedAt` DATETIME(3) NULL,
    ADD COLUMN `confirmedBy` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_confirmedBy_fkey` FOREIGN KEY (`confirmedBy`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
