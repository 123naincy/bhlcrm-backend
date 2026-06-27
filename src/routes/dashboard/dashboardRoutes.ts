import express from "express";
import { getDashboardStats , getTeamPerformance ,getSourcePerformance, getMyDashboard, getMyRecentFollowups, getMyMonthlyTrend, getTodayFollowups,getManagerSummary} from "../../controllers/dashboard/dashboardController";
import { protect } from "../../middleware/auth/authMiddleware";

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/team-performance", protect, getTeamPerformance);
router.get("/source-performance", protect, getSourcePerformance);
router.get("/my-dashboard" , protect, getMyDashboard);
router.get("/my-followups",protect,getMyRecentFollowups);
router.get("/my-trend",protect,getMyMonthlyTrend);
router.get("/today-followups",protect,getTodayFollowups);
router.get("/manager-summary",protect,getManagerSummary);
export default router;