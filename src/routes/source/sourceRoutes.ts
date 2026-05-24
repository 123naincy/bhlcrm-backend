import express from "express";

import {
  createSourceMapping,
  getSourceMappings,
  deleteSourceMapping,
} from "../../controllers/source/sourceController";

import { protect } from "../../middleware/auth/authMiddleware";
import { authorizeRoles } from "../../middleware/auth/roleMiddleware";

const router = express.Router();

router.get(
  "/",
  protect,
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  getSourceMappings
);

router.post(
  "/",
  protect,
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  createSourceMapping
);

router.delete(
  "/:id",
  protect,
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  deleteSourceMapping
);

export default router;