import express from "express";
import {
  getAllExecutives,
  getExecutiveById,
  createExecutive,
  updateExecutive,
  deleteExecutive,
} from "../controllers/executiveController.js";

const router = express.Router();

router.get("/", getAllExecutives);
router.get("/:id", getExecutiveById);
router.post("/", createExecutive);
router.put("/:id", updateExecutive);
router.delete("/:id", deleteExecutive);

export default router;
