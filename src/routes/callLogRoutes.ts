import express from "express";

import {
  createCallLog,
  getMyCallLogs,
  getLeadCallLogs,
} from "../controllers/activity/callLogController";

import { protect } from "../middleware/auth/authMiddleware";

const router = express.Router();

router.post(
  "/",
  protect,
  createCallLog
);

router.get(
  "/my",
  protect,
  getMyCallLogs
);

router.get(
  "/lead/:leadId",
  protect,
  getLeadCallLogs
);

export default router;