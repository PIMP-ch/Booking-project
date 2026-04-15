import Userr from "./Userr.js";
import Stadium from "./Stadiumm.js";
import Booking from "./Bookingg.js";
import Equipment from "./Equipmentt.js";
import Building from "./Buildingg.js";
import BookingEquipment from "./BookingEquipment.js";
import BookingBuilding from "./BookingBuilding.js";


Booking.belongsTo(Userr, { foreignKey: "userId" });
Userr.hasMany(Booking, { foreignKey: "userId" });

Booking.belongsTo(Stadium, { foreignKey: "stadiumId" });
Stadium.hasMany(Booking, { foreignKey: "stadiumId" });

// Stadium.hasMany(Building, { foreignKey: "stadiumId" });
// Building.belongsTo(Stadium, { foreignKey: "stadiumId" });

// Booking ↔ Equipment (many-to-many พร้อม quantity)
Booking.belongsToMany(Equipment, { through: BookingEquipment, foreignKey: "bookingId" });
Equipment.belongsToMany(Booking, { through: BookingEquipment, foreignKey: "equipmentId" });

// Booking ↔ Building (many-to-many)
Booking.belongsToMany(Building, { through: BookingBuilding, foreignKey: "bookingId" });
Building.belongsToMany(Booking, { through: BookingBuilding, foreignKey: "buildingId" });