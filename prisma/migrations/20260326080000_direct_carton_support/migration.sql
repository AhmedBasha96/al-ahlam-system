
-- AlterTable TransactionItem
ALTER TABLE `TransactionItem` ADD COLUMN `sellUnit` VARCHAR(191) NOT NULL DEFAULT 'PIECE',
    ADD COLUMN `unitQuantity` DECIMAL(20, 10) NOT NULL DEFAULT 0;

-- ModifyTable Product
ALTER TABLE `Product` MODIFY COLUMN `unitFactoryPrice` DECIMAL(20, 10) NOT NULL DEFAULT 0,
    MODIFY COLUMN `unitWholesalePrice` DECIMAL(20, 10) NOT NULL DEFAULT 0,
    MODIFY COLUMN `unitRetailPrice` DECIMAL(20, 10) NOT NULL DEFAULT 0;

-- Update TransactionItem constraints
ALTER TABLE `TransactionItem` MODIFY COLUMN `price` DECIMAL(20, 10) NOT NULL,
    MODIFY COLUMN `originalPrice` DECIMAL(20, 10) NOT NULL DEFAULT 0,
    MODIFY COLUMN `discountPercentage` DECIMAL(20, 10) NOT NULL DEFAULT 0,
    MODIFY COLUMN `cost` DECIMAL(20, 10) NOT NULL DEFAULT 0;
