import express from "express";
import { getDashboardStats , getTeamPerformance ,getSourcePerformance } from "../../controllers/dashboard/dashboardController";
import { protect } from "../../middleware/auth/authMiddleware";

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/team-performance", protect, getTeamPerformance);
router.get("/source-performance", protect, getSourcePerformance);
export default router;