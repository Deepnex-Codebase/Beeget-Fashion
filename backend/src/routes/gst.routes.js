import express from "express";
import GSTController from "../controllers/gst.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/role.middleware.js";

const router = express.Router();

// Admin routes for GST reports
router.get("/summary", verifyToken, isAdmin, GSTController.getGSTSummary);
router.get("/monthly", verifyToken, isAdmin, GSTController.getMonthlyReport);
router.get("/yearly", verifyToken, isAdmin, GSTController.getYearlyReport);
router.post("/process-orders", verifyToken, isAdmin, GSTController.processAllOrders);

export default router;