import cron from "node-cron";
import { Op } from "sequelize";
import Userr from "../models/Userr.js";

// อ่านค่า env ใน function เพื่อให้แน่ใจว่า dotenv.config() โหลดแล้ว
const getThreshold = () => {
    const inactiveMinutes = process.env.INACTIVE_MINUTES
        ? parseInt(process.env.INACTIVE_MINUTES, 10)
        : null;
    const inactiveDays = parseInt(process.env.INACTIVE_DAYS || "90", 10);

    const now = new Date();
    if (inactiveMinutes !== null) {
        now.setMinutes(now.getMinutes() - inactiveMinutes);
        return { threshold: now, unit: `${inactiveMinutes} นาที` };
    }
    now.setDate(now.getDate() - inactiveDays);
    return { threshold: now, unit: `${inactiveDays} วัน` };
};

export const markInactiveUsers = async () => {
    try {
        const { threshold, unit } = getThreshold();

        const result = await Userr.update(
            { status: "Inactive" },
            {
                where: {
                    status: "Active",
                    [Op.or]: [
                        { lastLoginAt: { [Op.lt]: threshold } },
                        {
                            lastLoginAt: null,
                            createdAt: { [Op.lt]: threshold },
                        },
                    ],
                },
                validate: false,
            }
        );

        const count = result[0];
        const now = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
        if (count > 0) {
            console.log(`[Inactivity Job] ${now} — เปลี่ยน ${count} บัญชีเป็น Inactive (ไม่ได้ login นานกว่า ${unit})`);
        } else {
            console.log(`[Inactivity Job] ${now} — ตรวจสอบแล้ว ไม่มีบัญชีที่ต้องเปลี่ยนสถานะ`);
        }
    } catch (error) {
        console.error("[Inactivity Job] Error:", error.message);
    }
};

export const startInactivityJob = () => {
    const cronSchedule = process.env.INACTIVITY_CRON || "0 0 * * *";
    const { unit } = getThreshold();

    cron.schedule(cronSchedule, markInactiveUsers, {
        timezone: "Asia/Bangkok",
    });

    console.log(`[Inactivity Job] เริ่มทำงาน — schedule: "${cronSchedule}" | threshold: ${unit}`);
};
