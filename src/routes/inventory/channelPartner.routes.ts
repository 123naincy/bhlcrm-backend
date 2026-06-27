import { Router } from "express";

import ChannelPartnerController from "../../controllers/inventory/ChannelPartnerController";
import { verifyToken } from "../../middleware/auth";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

/**
 * Authentication
 */
router.use(verifyToken);

/**
 * Search Channel Partners
 * Keep this route before '/:id'
 */
router.get(
  "/search",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  ChannelPartnerController.searchPartner
);

/**
 * Get All Channel Partners
 */
router.get(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  ChannelPartnerController.getPartners
);

/**
 * Get Channel Partner By Id
 */
router.get(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  ChannelPartnerController.getPartner
);

/**
 * Create Channel Partner
 */
router.post(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  ChannelPartnerController.createPartner
);

/**
 * Update Channel Partner
 */
router.put(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  ChannelPartnerController.updatePartner
);

/**
 * Change Partner Status
 */
router.patch(
  "/:id/status",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  ChannelPartnerController.changeStatus
);

export default router;