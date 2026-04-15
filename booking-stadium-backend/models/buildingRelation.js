import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const BuildingRelation = sequelize.define(
    "BuildingRelation",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        stadiumId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        buildingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true, // แทน 1
        },
    },
    {
        tableName: "building_relations",
        timestamps: true,
    }
);

export default BuildingRelation;