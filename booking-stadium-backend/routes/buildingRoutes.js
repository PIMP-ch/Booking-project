import express from "express";
import { checkBuildingAvaliable, getBuildings } from "../controllers/buildingController.js";

const router = express.Router();

router.get("/", getBuildings);
router.post("/check-building", checkBuildingAvaliable)

export default router;