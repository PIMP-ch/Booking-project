-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: booking_project
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookingbuildings`
--

DROP TABLE IF EXISTS `bookingbuildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookingbuildings` (
  `bookingId` int NOT NULL,
  `buildingId` int NOT NULL,
  PRIMARY KEY (`bookingId`,`buildingId`),
  KEY `buildingId` (`buildingId`),
  CONSTRAINT `bookingbuildings_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bookingbuildings_ibfk_2` FOREIGN KEY (`buildingId`) REFERENCES `buildings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookingbuildings`
--

LOCK TABLES `bookingbuildings` WRITE;
/*!40000 ALTER TABLE `bookingbuildings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookingbuildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookingequipments`
--

DROP TABLE IF EXISTS `bookingequipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookingequipments` (
  `bookingId` int NOT NULL,
  `equipmentId` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`bookingId`,`equipmentId`),
  UNIQUE KEY `BookingEquipments_equipmentId_bookingId_unique` (`bookingId`,`equipmentId`),
  KEY `equipmentId` (`equipmentId`),
  CONSTRAINT `bookingequipments_ibfk_1` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bookingequipments_ibfk_2` FOREIGN KEY (`equipmentId`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookingequipments`
--

LOCK TABLES `bookingequipments` WRITE;
/*!40000 ALTER TABLE `bookingequipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookingequipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `activityName` varchar(255) DEFAULT '',
  `cancelReason` varchar(255) DEFAULT '',
  `startDate` datetime NOT NULL,
  `endDate` datetime NOT NULL,
  `startTime` varchar(255) NOT NULL,
  `endTime` varchar(255) NOT NULL,
  `status` enum('pending','confirmed','canceled','Return Success') NOT NULL DEFAULT 'pending',
  `filePath` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `userId` int DEFAULT NULL,
  `stadiumId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `stadiumId` (`stadiumId`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`stadiumId`) REFERENCES `stadium` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `building_relations`
--

DROP TABLE IF EXISTS `building_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `building_relations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stadiumId` int NOT NULL,
  `buildingId` int NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stadiumId` (`stadiumId`),
  KEY `buildingId` (`buildingId`),
  CONSTRAINT `building_relations_ibfk_1` FOREIGN KEY (`stadiumId`) REFERENCES `stadium` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `building_relations_ibfk_2` FOREIGN KEY (`buildingId`) REFERENCES `buildings` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `building_relations`
--

LOCK TABLES `building_relations` WRITE;
/*!40000 ALTER TABLE `building_relations` DISABLE KEYS */;
/*!40000 ALTER TABLE `building_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
INSERT INTO `buildings` VALUES (1,'อาคารศูนย์กีฬาเฉลิมพระเกียรติ',1,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(2,'อาคารโรงยิมอเนกประสงค์',1,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(3,'อาคารหอประชุมและกิจการนักศึกษา',1,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(4,'สนามกีฬากลางแจ้ง',1,'2025-12-31 23:59:59','2025-12-31 23:59:59');
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipment`
--

DROP TABLE IF EXISTS `equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `status` enum('available','unavailable') NOT NULL DEFAULT 'available',
  `imageUrl` varchar(255) DEFAULT '',
  `sportTypeId` int NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipment`
--

LOCK TABLES `equipment` WRITE;
/*!40000 ALTER TABLE `equipment` DISABLE KEYS */;
INSERT INTO `equipment` VALUES (1,'	เสื้อแบ่งทีม',12,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(2,'	ลูกบาสเก็ตบอล',12,'available','',3,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(3,'ไม้แบดมินตัน',30,'available','',4,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(4,'	ไม้ปิงปอง',30,'available','',5,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(5,'ลูกฟุตซอล',41,'available','',6,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(6,'ลูกวอลเลย์บอล',15,'available','',7,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(7,'	ลูกตะกร้อ',9,'available','',8,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(8,'	ไม้เทนนิส',8,'available','',9,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(9,'	ลูกเปตอง',24,'available','',10,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(10,'ตะกร้าแชร์บอล',6,'available','',11,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(11,'	ธงไลน์แมน',3,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(12,'	นกหวีด',9,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(13,'นาฬิกาจับเวลา',5,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(14,'	ตลับเมตร',2,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(15,'หมากรุก',1,'available','',12,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(16,'หมากฮอส',2,'available','',12,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(17,'สกอร์บอร์ดไฟฟ้า',13,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(18,'ป้ายบอกคะแนน(เคลื่อนที่)',2,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(19,'ป้ายบอกคะแนน(ตั้งโต๊ะ)',2,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(20,'ป้ายบอกคะแนนเปตอง',2,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(21,'	ป้ายเปลี่ยนตัวนักกีฬา',1,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(22,'ชุดตัดสินกีฬาฟุตซอล/บาสเก็ตบอล',14,'available','',2,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(23,'	ลูกฟุตบอล',10,'available','',6,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(24,'ลูกแชร์บอล',4,'available','',11,'2025-12-31 23:59:59','2025-12-31 23:59:59');
/*!40000 ALTER TABLE `equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sport_categories`
--

DROP TABLE IF EXISTS `sport_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sport_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sport_categories`
--

LOCK TABLES `sport_categories` WRITE;
/*!40000 ALTER TABLE `sport_categories` DISABLE KEYS */;
INSERT INTO `sport_categories` VALUES (1,'ทุกประเภท','2025-12-31 23:59:59','2025-12-31 23:59:59'),(2,'อุปกรณ์ตัดสิน','2025-12-31 23:59:59','2025-12-31 23:59:59'),(3,'บาสเก็ตบอล','2025-12-31 23:59:59','2025-12-31 23:59:59'),(4,'แบดมินตัน','2025-12-31 23:59:59','2025-12-31 23:59:59'),(5,'ปิงปอง','2025-12-31 23:59:59','2025-12-31 23:59:59'),(6,'ฟุตบอล','2025-12-31 23:59:59','2025-12-31 23:59:59'),(7,'วอลเลย์บอล','2025-12-31 23:59:59','2025-12-31 23:59:59'),(8,'ตะกร้อ','2025-12-31 23:59:59','2025-12-31 23:59:59'),(9,'เทนนิส','2025-12-31 23:59:59','2025-12-31 23:59:59'),(10,'เปตอง','2025-12-31 23:59:59','2025-12-31 23:59:59'),(11,'แชร์บอล','2025-12-31 23:59:59','2025-12-31 23:59:59'),(12,'เกมกระดาน','2025-12-31 23:59:59','2025-12-31 23:59:59');
/*!40000 ALTER TABLE `sport_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stadium`
--

DROP TABLE IF EXISTS `stadium`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stadium` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nameStadium` varchar(255) NOT NULL,
  `descriptionStadium` text NOT NULL,
  `contactStadium` varchar(255) NOT NULL,
  `statusStadium` enum('active','inactive','IsBooking') NOT NULL DEFAULT 'active',
  `sportTypeId` int DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stadium`
--

LOCK TABLES `stadium` WRITE;
/*!40000 ALTER TABLE `stadium` DISABLE KEYS */;
INSERT INTO `stadium` VALUES (1,'ลานกีฬา/สันทนาการ','กีฬาสันทนาการ','0615377046','active',1,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(2,'สนามเทนนิส','สนามเทนนิส','0615377046','active',9,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(3,'โต๊ะเทเบิ้ลเทนนิส','โต๊ะเทเบิ้ลเทนนิสหรือโต๊ะปิงปอง','0615377046','active',5,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(4,'สนามเปตอง','สนามเปตองกลางแจ้ง','0615377046','active',10,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(5,'สนามแชร์บอล','สนามแชร์บอลกีฬาสันทนาการ','0615377046','active',11,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(6,'สนามตะกร้อ','สนามตะกร้อพร้อมเสาตาข่าย','0615377046','active',8,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(7,'สนามฟุตซอล','สนามฟุตซอลในร่ม','0615377046','active',6,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(8,'สนามวอลเลย์บอล','สนามวอลเลย์บอลในร่ม','0615377046','active',7,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(9,'สนามแบดมินตัน','สนามแบดมินตันในร่ม','090-345-6789','active',4,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(10,'สนามบาสเก็ตบอล','ในร่ม มาตรฐาน','080-333-4444','active',3,'2025-12-31 23:59:59','2025-12-31 23:59:59'),(11,'สนามฟุตบอล','สนามฟุตบอลกลางแจ้ง','080-111-2222','active',6,'2025-12-31 23:59:59','2025-12-31 23:59:59');
/*!40000 ALTER TABLE `stadium` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stadium_images`
--

DROP TABLE IF EXISTS `stadium_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stadium_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stadiumId` int NOT NULL,
  `url` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stadiumId` (`stadiumId`),
  CONSTRAINT `stadium_images_ibfk_1` FOREIGN KEY (`stadiumId`) REFERENCES `stadium` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stadium_images`
--

LOCK TABLES `stadium_images` WRITE;
/*!40000 ALTER TABLE `stadium_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `stadium_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staffs`
--

DROP TABLE IF EXISTS `staffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staffs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('superadmin','admin','staff') NOT NULL DEFAULT 'staff',
  `password` varchar(255) NOT NULL,
  `avatarUrl` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staffs`
--

LOCK TABLES `staffs` WRITE;
/*!40000 ALTER TABLE `staffs` DISABLE KEYS */;
INSERT INTO `staffs` VALUES (1,'Super Admin','superadmin@email.com','superadmin','admin123','/uploads/avatars/images-1770821197609.jpg','2025-12-31 23:59:59','2025-12-31 23:59:59'),(2,'Operator One','operator1@booking.local','staff','staff123','','2025-12-31 23:59:59','2025-12-31 23:59:59'),(3,'test','test@email.com','admin','admin','','2025-12-31 23:59:59','2025-12-31 23:59:59'),(4,'staff01','staff01@email.com','staff','123456','','2025-12-31 23:59:59','2025-12-31 23:59:59');
/*!40000 ALTER TABLE `staffs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fullname` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `userType` enum('student','staff') NOT NULL DEFAULT 'student',
  `fieldOfStudy` varchar(255) DEFAULT NULL,
  `year` int DEFAULT NULL,
  `department` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `blockUntil` datetime DEFAULT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phoneNumber` (`phoneNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Chidapha Detpraphai','test.staff@email.com','0923142779','staff',NULL,NULL,'ITI','123456',NULL,NULL,NULL,'2025-12-31 23:59:59','2025-12-31 23:59:59');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22  3:12:55
