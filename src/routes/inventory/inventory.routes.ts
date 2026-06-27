import { Router } from "express";

import InventoryController from "../../controllers/inventory/inventory.controller";
import { verifyToken } from "../../middleware/auth";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

/**
 * All Inventory Routes Require Login
 */
router.use(verifyToken);

/**
 * Get Inventory Dashboard
 */
router.get(
  "/",
  InventoryController.getInventory
);

/**
 * Get Inventory Detail
 */
router.get(
  "/:id",
  InventoryController.getInventoryById
);

/**
 * Create Inventory
 * Super Admin / Admin
 */
router.post(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  InventoryController.createInventory
);

/**
 * Update Inventory
 */
router.put(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  InventoryController.updateInventory
);

/**
 * Change Inventory Status
 */
router.patch(
  "/:id/status",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  InventoryController.changeInventoryStatus
);

/**
 * Delete Inventory
 */
router.delete(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  InventoryController.deleteInventory
);

export default router;