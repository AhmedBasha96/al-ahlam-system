-- CreateTable
CREATE TABLE `_UserAgencies` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_UserAgencies_AB_unique`(`A`, `B`),
    INDEX `_UserAgencies_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_UserAgencies` ADD CONSTRAINT `_UserAgencies_A_fkey` FOREIGN KEY (`A`) REFERENCES `Agency`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserAgencies` ADD CONSTRAINT `_UserAgencies_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
