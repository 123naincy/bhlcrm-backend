import express from "express";
import { protect } from "../middleware/auth/authMiddleware";

import {
  createFollowUp,
  getLeadFollowUps,
  updateFollowUp,
  deleteFollowUp,
} from "../controllers/followup/followUpController";

const router = express.Router();

router.post("/", protect, createFollowUp);

router.get(
  "/:leadId",
  protect,
  getLeadFollowUps
);

router.patch("/:id", protect, updateFollowUp);

router.delete("/:id", protect, deleteFollowUp);

export default router;