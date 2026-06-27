import { Router } from "express";

import PaymentController from "../../controllers/inventory/PaymentController";
import upload from "../../middleware/upload";
import { verifyToken } from "../../middleware/auth";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

/**
 * Authentication
 */
router.use(verifyToken);

/**
 * Get Payment History By Booking
 */
router.get(
  "/booking/:bookingId",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  PaymentController.getPayments
);

/**
 * Get Payment Details
 */
router.get(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  PaymentController.getPayment
);

/**
 * Create Payment
 */
router.post(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  upload.single("receipt"),
  PaymentController.createPayment
);

/**
 * Download Receipt
 */
router.get(
  "/receipt/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  PaymentController.downloadReceipt
);

/**
 * Delete Payment
 */
router.delete(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  PaymentController.deletePayment
);

export default router;