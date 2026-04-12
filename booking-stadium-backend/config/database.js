import { Sequelize } from "sequelize";

const sequelize = new Sequelize('booking_project', 'root', 'root', {
    host: 'localhost',
    dialect: "mysql",
});

export default sequelize;