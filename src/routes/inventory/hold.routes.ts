import { Router } from "express";

import HoldController from "../../controllers/inventory/HoldController";
import { verifyToken } from "../../middleware/auth";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

/**
 * Authentication
 */
router.use(verifyToken);

/**
 * Get All Active Holds
 */
router.get(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  HoldController.getHolds
);

/**
 * Get Hold Details
 */
router.get(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  HoldController.getHold
);

/**
 * Create Hold
 */
router.post(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  HoldController.createHold
);

/**
 * Release Hold
 */
router.patch(
  "/:id/release",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  HoldController.releaseHold
);

/**
 * Extend Hold
 */
router.patch(
  "/:id/extend",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  HoldController.extendHold
);

export default router;