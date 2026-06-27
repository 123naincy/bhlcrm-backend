import { Router } from "express";

import DashboardController from "../../controllers/inventory/DashboardController";
import { verifyToken } from "../../middleware/auth";

const router = Router();

router.use(verifyToken);

router.get(
  "/",
  DashboardController.getDashboard
);

router.get(
  "/summary",
  DashboardController.getSummary
);

export default router;