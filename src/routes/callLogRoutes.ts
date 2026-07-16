import express from "express";

import {
  createCallLog,
  getMyCallLogs,
  getLeadCallLogs,
} from "../controllers/activity/callLogController";

import {
  playRecording,
  streamRecording,
} from "../controllers/activity/playRecording";

import { protect } from "../middleware/auth/authMiddleware";

const router = express.Router();

router.post("/", protect, createCallLog);

router.get("/my", protect, getMyCallLogs);

router.get(
  "/lead/:leadId",
  protect,
  getLeadCallLogs
);

router.get(
  "/:callLogId/play",
  protect,
  playRecording
);

router.get(
  "/:callLogId/stream",
  protect,
  streamRecording
);

export default router;
