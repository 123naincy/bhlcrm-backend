import express from "express";
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} from "../../controllers/project/projectController";

import { protect } from "../../middleware/auth/authMiddleware";
import { authorizeRoles } from "../../middleware/auth/roleMiddleware";

const router = express.Router();

router.get(
  "/",
  protect,
  getProjects
);

router.post(
  "/",
  protect,
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  createProject
);

router.put(
  "/:id",
  protect,
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  updateProject
);

router.delete(
  "/:id",
  protect,
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  deleteProject
);

export default router;