import Building from "../models/Building.js";

export const getBuildings = async (_req, res) => {
    try{
    const buildings = await Building.find().sort({ createdAt: -1 });
    res.json(buildings);
    } catch (err) {
        res.status(500).json({ message: err.message});
    }
};