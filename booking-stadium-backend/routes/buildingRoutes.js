import express from "express";
import { checkBuildingAvaliable, getBuildings, createBuilding, updateBuilding, deleteBuilding } from "../controllers/buildingController.js";

const router = express.Router();

router.get("/", getBuildings);
router.post("/", createBuilding);
router.put("/:id", updateBuilding);
router.delete("/:id", deleteBuilding);
router.post("/check-building", checkBuildingAvaliable);

export default router;