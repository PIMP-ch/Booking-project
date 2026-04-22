import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Equipment from "./Equipmentt.js";

const EquipmentAdjustmentTransaction = sequelize.define(
    "EquipmentAdjustmentTransaction",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        equipmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Equipment,
                key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
        },
        type: {
            type: DataTypes.ENUM("in", "out"),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        timestamps: true,
        tableName: "equipment_adjustment_transactions",
    }
);

// Association
Equipment.hasMany(EquipmentAdjustmentTransaction, {
    foreignKey: "equipmentId",
    as: "adjustmentTransactions",
});

EquipmentAdjustmentTransaction.belongsTo(Equipment, {
    foreignKey: "equipmentId",
    as: "equipment",
});

export default EquipmentAdjustmentTransaction;
