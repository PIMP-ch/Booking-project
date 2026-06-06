-- รัน script นี้ใน MySQL Workbench เพื่อล้าง index ที่ซ้ำ
-- หลังรันแล้วลบไฟล์นี้ได้เลย

USE booking_project;

-- ดู index ทั้งหมดก่อน
SHOW INDEX FROM Users;

-- ล้าง index ทั้งหมดที่ไม่ใช่ PRIMARY (ชื่ออาจต่างกัน ดูจาก SHOW INDEX ด้านบน)
-- Sequelize มักสร้างชื่อตามชื่อ column เช่น email, email_2, email_3 ...
-- รัน query นี้เพื่อดึง DROP INDEX commands ออกมาทีเดียว:

SELECT CONCAT('ALTER TABLE Users DROP INDEX `', INDEX_NAME, '`;') AS drop_cmd
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'booking_project'
  AND TABLE_NAME = 'Users'
  AND INDEX_NAME != 'PRIMARY'
  AND NON_UNIQUE = 0
ORDER BY INDEX_NAME;

-- คัดลอก output ทั้งหมดจาก drop_cmd แล้วรันใหม่อีกที
-- จากนั้นค่อยรัน 2 บรรทัดนี้เพื่อ add กลับแค่อันเดียว:
-- ALTER TABLE Users ADD UNIQUE INDEX `email_unique` (`email`);
-- ALTER TABLE Users ADD UNIQUE INDEX `phoneNumber_unique` (`phoneNumber`);
