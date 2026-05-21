-- Clean up partial execution from previous failed attempts
DROP TABLE IF EXISTS `JournalEntry`;
DROP TABLE IF EXISTS `DailyClosing`;

-- AlterTable (Safely update Enum)
ALTER TABLE `Transaction` MODIFY `type` ENUM('SALE', 'PURCHASE', 'RETURN_IN', 'RETURN_OUT', 'COLLECTION', 'SUPPLY_PAYMENT', 'INITIAL_STOCK', 'REP_SUBMISSION') NOT NULL;

-- CreateTable
CREATE TABLE `JournalEntry` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `type` ENUM('DEBIT', 'CREDIT') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `referenceId` VARCHAR(191) NULL,
    `referenceType` VARCHAR(191) NULL,
    `agencyId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JournalEntry_agencyId_idx`(`agencyId`),
    INDEX `JournalEntry_userId_idx`(`userId`),
    INDEX `JournalEntry_referenceId_idx`(`referenceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DailyClosing` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `agencyId` VARCHAR(191) NOT NULL,
    `openingBalance` DECIMAL(65, 30) NOT NULL,
    `closingBalance` DECIMAL(65, 30) NULL,
    `expectedBalance` DECIMAL(65, 30) NULL,
    `status` ENUM('OPEN', 'CLOSED', 'RECONCILED') NOT NULL DEFAULT 'OPEN',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,

    INDEX `DailyClosing_agencyId_idx`(`agencyId`),
    INDEX `DailyClosing_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey (Using UNIQUE constraint names to avoid global namespace conflicts)
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_agencyId_fkey_v2` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_userId_fkey_v2` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DailyClosing` ADD CONSTRAINT `DailyClosing_agencyId_fkey_v2` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DailyClosing` ADD CONSTRAINT `DailyClosing_userId_fkey_v2` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
