import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth/authMiddleware";
import { uploadRecording } from "../controllers/activity/uploadRecordingController";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post(
  "/recording",
  protect,
  upload.single("recording"),
  uploadRecording
);

export default router;