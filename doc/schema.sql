-- Create Database
CREATE DATABASE IF NOT EXISTS auradraw DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE auradraw;

-- 1. User Table
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    `email` VARCHAR(128) NOT NULL COMMENT 'User Email',
    `provider` VARCHAR(32) NOT NULL DEFAULT 'email' COMMENT 'Auth Provider: email, google',
    `status` VARCHAR(32) NOT NULL DEFAULT 'enabled' COMMENT 'Account Status: enabled, disabled',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User Basic Info';

-- 2. User Credential Table
CREATE TABLE IF NOT EXISTS `user_credential` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK -> user.id',
    `password_hash` VARCHAR(64) NOT NULL COMMENT 'Encrypted Password',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User Credentials';

-- 3. User Balance Table
CREATE TABLE IF NOT EXISTS `user_balance` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK -> user.id',
    `balance` BIGINT NOT NULL DEFAULT 0 COMMENT 'Remaining Credits',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User Wallet Balance';

-- 4. Poster Generation Table
CREATE TABLE IF NOT EXISTS `poster` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK -> user.id',
    `prompt` JSON NOT NULL COMMENT 'User Input Parameters (Prompt, Style, etc.)',
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'Status: pending, processing, completed, failed',
    `image_url` VARCHAR(512) DEFAULT NULL COMMENT 'Result Image URL',
    `cost` BIGINT NOT NULL DEFAULT 0 COMMENT 'Credits Consumed',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Poster Generation Records';

-- 5. Order Table
CREATE TABLE IF NOT EXISTS `order` (
 `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `order_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Business Order ID',
  `user_id` bigint unsigned NOT NULL COMMENT 'FK -> user.id',
  `amount` bigint NOT NULL COMMENT 'Payment Amount (CNY Cents)',
  `credits` bigint NOT NULL COMMENT 'Credits to Add',
  `payment_method` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'alipay, wechat',
  `pay_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '支付链接',
  `product_info` json NOT NULL COMMENT '下单时商品信息',
  `status` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'Status: pending, paid, cancelled',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `expire_at` timestamp NOT NULL COMMENT '订单过期时间',
  `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Recharge Orders';


-- 6. Transaction Table
CREATE TABLE IF NOT EXISTS `transaction` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
    `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK -> user.id',
    `type` VARCHAR(32) NOT NULL COMMENT 'recharge, consume',
    `amount` BIGINT NOT NULL COMMENT 'Credit Change Amount (+/-)',
    `reference_id` BIGINT UNSIGNED NOT NULL COMMENT 'Related ID (Order ID or Poster ID)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Credit Transaction History';


CREATE TABLE `verify_code` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'Primary Key',
  `email` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User Email',
  `code` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Verify Code',
  `type` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '""' COMMENT 'verify code tyep',
  `token` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Verify Token',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expired_at` timestamp NOT NULL COMMENT 'Expire Time',
  `used_at` timestamp NULL DEFAULT NULL COMMENT 'Used Time',
  PRIMARY KEY (`id`),
  KEY `idx_email_code` (`email`,`code`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Verify Code';