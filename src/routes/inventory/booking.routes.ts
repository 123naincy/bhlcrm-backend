import { Router } from "express";

import BookingController from "../../controllers/inventory/BookingController";
import upload from "../../middleware/upload";
import { verifyToken } from "../../middleware/auth";
import { authorizeRoles } from "../../middleware/authorizeRoles";

const router = Router();

/**
 * Authentication
 */
router.use(verifyToken);

/**
 * Get All Bookings
 */
router.get(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  BookingController.getBookings
);

/**
 * Get Booking By Inventory
 */
router.get(
  "/by-inventory/:inventoryId",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  BookingController.getBookingByInventory
);

/**
 * Upload Booking Document
 */
router.post(
  "/:id/documents",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  upload.single("file"),
  BookingController.uploadDocument
);

/**
 * Delete Booking Document
 */
router.delete(
  "/:id/documents/:documentId",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  BookingController.deleteDocument
);

/**
 * Get Booking By Id
 */
router.get(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  BookingController.getBooking
);

/**
 * Create Booking (Mark Sold)
 */
router.post(
  "/",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  upload.single("receipt"),
  BookingController.createBooking
);

/**
 * Update Booking
 */
router.put(
  "/:id",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  BookingController.updateBooking
);

/**
 * Cancel Booking
 */
router.patch(
  "/:id/cancel",
  authorizeRoles(
    "super_admin",
    "admin"
  ),
  BookingController.cancelBooking
);

export default router;