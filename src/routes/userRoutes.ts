import express from "express";
import { protect } from "../middleware/auth/authMiddleware";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getTeamMembers
} from "../controllers/user/userController";

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/:id", protect, getUserById);
router.post("/", protect, createUser);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);
router.get(
  "/team-members",
  protect,
  getTeamMembers
);
router.patch(
  "/status/:id",
  protect,
  toggleUserStatus
);

export default router;