-- AlterTable (Add columns to Transaction, AccountRecord, Product, TransactionItem)
ALTER TABLE `Transaction` ADD COLUMN `imageUrl` LONGTEXT NULL;
ALTER TABLE `AccountRecord` ADD COLUMN `category` VARCHAR(191) NULL, ADD COLUMN `imageUrl` LONGTEXT NULL;
ALTER TABLE `TransactionItem` ADD COLUMN `cost` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000;

-- AlterTable (Make AccountRecord.agencyId nullable if not already)
-- Note: In init it was NOT NULL. In schema.prisma it is String?
ALTER TABLE `AccountRecord` MODIFY `agencyId` VARCHAR(191) NULL;

-- Update Enums (Role and TransactionType)
-- Note: MySQL doesn't support easy Enum updates without re-definition
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN', 'MANAGER', 'ACCOUNTANT', 'WAREHOUSE_KEEPER', 'SALES_REPRESENTATIVE', 'SALES_RECORDER') NOT NULL DEFAULT 'ACCOUNTANT';
ALTER TABLE `Transaction` MODIFY `type` ENUM('SALE', 'PURCHASE', 'RETURN_IN', 'RETURN_OUT', 'COLLECTION', 'SUPPLY_PAYMENT') NOT NULL;

-- CreateTable (Bank, BankTransaction, Loan, Installment)
CREATE TABLE `Bank` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NULL,
    `balance` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `BankTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `type` ENUM('DEPOSIT', 'WITHDRAWAL') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bankId` VARCHAR(191) NOT NULL,
    `imageUrl` LONGTEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Loan` (
    `id` VARCHAR(191) NOT NULL,
    `bankId` VARCHAR(191) NOT NULL,
    `principal` DECIMAL(65, 30) NOT NULL,
    `interest` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `totalAmount` DECIMAL(65, 30) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'PAID', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Installment` (
    `id` VARCHAR(191) NOT NULL,
    `loanId` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `paidDate` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKeys
ALTER TABLE `BankTransaction` ADD CONSTRAINT `BankTransaction_bankId_fkey` FOREIGN KEY (`bankId`) REFERENCES `Bank`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Loan` ADD CONSTRAINT `Loan_bankId_fkey` FOREIGN KEY (`bankId`) REFERENCES `Bank`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `Loan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
