import { Sequelize } from "sequelize";

const sequelize = new Sequelize('booking_project', 'root', 'root', {
    host: 'localhost',
    dialect: "mysql",
    timezone: "+07:00", // Bangkok time
    dialectOptions: {
        timezone: "+07:00",
    },
});

export default sequelize;