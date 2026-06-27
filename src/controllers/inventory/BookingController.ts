import { Request, Response } from "express";
import bookingService from "../../services/inventory/booking.service";
import documentService from "../../services/inventory/document.service";
import timelineService from "../../services/inventory/timeline.service";
import {
  parseBookingPayload,
} from "../../utils/parseBookingPayload";
import { DocumentType } from "../../models/inventory/Document";

class BookingController {
  /**
   * Create Booking (Mark Sold)
   */
  async createBooking(
    req: Request,
    res: Response
  ) {
    try {
      const payload =
        parseBookingPayload(
          req.body
        );

      const booking =
        await bookingService.createBooking(
          payload,
          req.user.id
        );

      return res.status(201).json({
        success: true,
        message:
          "Booking created successfully.",
        data: booking,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to create booking.",
      });
    }
  }

  /**
   * Booking by inventory plot
   */
  async getBookingByInventory(
    req: Request,
    res: Response
  ) {
    try {
      const booking =
        await bookingService.getBookingByInventoryId(
          String(req.params.inventoryId)
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      return res.json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Booking Details
   */
  async getBooking(
    req: Request,
    res: Response
  ) {
    try {
      const booking =
        await bookingService.getBookingById(
          String(req.params.id)
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      return res.json({
        success: true,
        data: booking,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Booking List
   */
  async getBookings(
    req: Request,
    res: Response
  ) {
    try {
      const bookings =
        await bookingService.getBookings();

      return res.json({
        success: true,
        data: bookings,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update Booking
   */
  async updateBooking(
    req: Request,
    res: Response
  ) {
    try {
      const booking =
        await bookingService.updateBooking(
          String(req.params.id),
          req.body
        );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Booking updated successfully.",
        data: booking,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Cancel Booking
   */
  async cancelBooking(
    req: Request,
    res: Response
  ) {
    try {
      await bookingService.cancelBooking(
        String(req.params.id),
        req.user.id
      );

      return res.json({
        success: true,
        message:
          "Booking cancelled successfully.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Upload Booking Document
   */
  async uploadDocument(
    req: Request,
    res: Response
  ) {
    try {
      const bookingId = String(
        req.params.id
      );

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Document file is required.",
        });
      }

      const documentType =
        (req.body.documentType ||
          "other") as DocumentType;

      const doc =
        await documentService.upload(
          "booking",
          bookingId,
          req.file,
          documentType,
          req.user.id,
          req.body.title
        );

      await timelineService.createTimeline(
        {
          entityType: "booking",
          entityId: doc._id,
          bookingId: bookingId as any,
          title: "Document Uploaded",
          description: `${doc.title} uploaded.`,
          action: "document_uploaded",
          createdBy: req.user.id as any,
        }
      );

      return res.status(201).json({
        success: true,
        message:
          "Document uploaded successfully.",
        data: {
          _id: String(doc._id),
          name: doc.title,
          type: doc.documentType,
          fileUrl: doc.fileUrl,
          uploadedAt: (doc as any)
            .createdAt,
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete Booking Document
   */
  async deleteDocument(
    req: Request,
    res: Response
  ) {
    try {
      const doc =
        await documentService.getById(
          String(req.params.documentId)
        );

      if (!doc) {
        return res.status(404).json({
          success: false,
          message:
            "Document not found.",
        });
      }

      await documentService.delete(
        String(req.params.documentId)
      );

      return res.json({
        success: true,
        message:
          "Document deleted successfully.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new BookingController();
