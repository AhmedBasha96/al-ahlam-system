-- AlterTable
ALTER TABLE `AccountRecord` ADD COLUMN `customerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `status` ENUM('PENDING', 'ACTIVE', 'CANCELED') NOT NULL DEFAULT 'ACTIVE';

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

-- CreateTable (Missing Implicit M-N Table)
CREATE TABLE `_KeeperWarehouses` (
    `A` VARCHAR(191) NOT NULL,

    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_KeeperWarehouses_AB_unique`(`A`, `B`),
    INDEX `_KeeperWarehouses_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_KeeperWarehouses` ADD CONSTRAINT `_KeeperWarehouses_A_fkey` FOREIGN KEY (`A`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `_KeeperWarehouses` ADD CONSTRAINT `_KeeperWarehouses_B_fkey` FOREIGN KEY (`B`) REFERENCES `Warehouse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable (Loading Requests)
CREATE TABLE `LoadingRequest` (
    `id` VARCHAR(191) NOT NULL,
    `repId` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `agencyId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LoadingRequestItem` (
    `id` VARCHAR(191) NOT NULL,
    `loadingRequestId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKeys (Loading Requests)
ALTER TABLE `LoadingRequest` ADD CONSTRAINT `LoadingRequest_repId_fkey` FOREIGN KEY (`repId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `LoadingRequest` ADD CONSTRAINT `LoadingRequest_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `LoadingRequest` ADD CONSTRAINT `LoadingRequest_agencyId_fkey` FOREIGN KEY (`agencyId`) REFERENCES `Agency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `LoadingRequestItem` ADD CONSTRAINT `LoadingRequestItem_loadingRequestId_fkey` FOREIGN KEY (`loadingRequestId`) REFERENCES `LoadingRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LoadingRequestItem` ADD CONSTRAINT `LoadingRequestItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
