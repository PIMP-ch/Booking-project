import Userr from "./Userr.js";
import Stadium from "./Stadiumm.js";
import Booking from "./Bookingg.js";
import Equipment from "./Equipmentt.js";
import Building from "./Buildingg.js";
import BookingEquipment from "./BookingEquipment.js";
import BookingBuilding from "./BookingBuilding.js";
import BuildingRelation from "./BuildingRelation.js";

Booking.belongsTo(Userr, { foreignKey: "userId" });
Userr.hasMany(Booking, { foreignKey: "userId" });

Booking.belongsTo(Stadium, { foreignKey: "stadiumId" });
Stadium.hasMany(Booking, { foreignKey: "stadiumId" });

Stadium.hasMany(BuildingRelation, { foreignKey: "stadiumId", as: "buildingRelations" });
BuildingRelation.belongsTo(Stadium, { foreignKey: "stadiumId" });
BuildingRelation.belongsTo(Building, { foreignKey: "buildingId", as: "building" });

Booking.belongsToMany(Equipment, { through: BookingEquipment, foreignKey: "bookingId" });
Equipment.belongsToMany(Booking, { through: BookingEquipment, foreignKey: "equipmentId" });

Booking.belongsToMany(Building, { through: BookingBuilding, foreignKey: "bookingId" });
Building.belongsToMany(Booking, { through: BookingBuilding, foreignKey: "buildingId" });
// หมายเหตุ: EquipmentAdjustmentTransaction associations ถูก define ใน models/EquipmentAdjustmentTransaction.js แล้ว
