import Building from "../models/Buildingg.js";

export const getBuildings = async (_req, res) => {
    try {
        const buildings = await Building.findAll({
            order: [["createdAt", "DESC"]]
        });
        res.json(buildings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};