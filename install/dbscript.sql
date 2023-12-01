CREATE TABLE `beer` (
  `id` int NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  `description` varchar(2048) DEFAULT NULL,
  `image` varchar(256) DEFAULT NULL,
  `category` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `beer_price` (
  `beer_id` int NOT NULL,
  `amount` varchar(128) NOT NULL,
  `price` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`beer_id`,`amount`),
  CONSTRAINT `FK__beer_price__beer` FOREIGN KEY (`beer_id`) REFERENCES `beer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;