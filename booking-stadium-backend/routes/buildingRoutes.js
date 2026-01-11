import express from "express";
import { getBuildings } from "../controllers/buildingController.js";

const router = express.Router();

router.get("/", getBuildings);

export default router;