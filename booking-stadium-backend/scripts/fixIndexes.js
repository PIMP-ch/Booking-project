// รันครั้งเดียว: node scripts/fixIndexes.js
import sequelize from "../config/database.js";

const fix = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB");

    // 1. ดึงชื่อ index ทั้งหมดที่ไม่ใช่ PRIMARY
    const [indexes] = await sequelize.query(`
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = 'booking_project'
        AND TABLE_NAME = 'Users'
        AND INDEX_NAME != 'PRIMARY'
      GROUP BY INDEX_NAME
    `);

    console.log(`พบ ${indexes.length} indexes ที่ต้องลบ:`, indexes.map(i => i.INDEX_NAME));

    // 2. ลบทุก index
    for (const { INDEX_NAME } of indexes) {
      try {
        await sequelize.query(`ALTER TABLE Users DROP INDEX \`${INDEX_NAME}\``);
        console.log(`  ✓ dropped: ${INDEX_NAME}`);
      } catch (e) {
        console.log(`  ✗ skip: ${INDEX_NAME} — ${e.message}`);
      }
    }

    // 3. add unique กลับแค่ 2 อัน
    await sequelize.query("ALTER TABLE Users ADD UNIQUE INDEX `email_unique` (`email`)");
    console.log("✓ added: email_unique");

    await sequelize.query("ALTER TABLE Users ADD UNIQUE INDEX `phoneNumber_unique` (`phoneNumber`)");
    console.log("✓ added: phoneNumber_unique");

    console.log("\nเสร็จแล้ว! ลองรัน nodemon server.js ได้เลย");
    process.exit(0);
  } catch (e) {
    console.error("Error:", e.message);
    process.exit(1);
  }
};

fix();
