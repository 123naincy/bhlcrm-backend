import { Request, Response } from "express";
import paymentService from "../../services/inventory/payment.service";
import {
  parsePaymentPayload,
} from "../../utils/parsePaymentPayload";

class PaymentController {
  /**
   * Create Payment
   */
  async createPayment(
    req: Request,
    res: Response
  ) {
    try {
      const payload =
        parsePaymentPayload(
          req.body,
          req.file
        );

      if (
        !payload.bookingId ||
        !payload.paymentScheduleId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Booking and installment are required.",
        });
      }

      if (
        !payload.amount ||
        payload.amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid amount is required.",
        });
      }

      const payment =
        await paymentService.createPayment(
          payload as any,
          req.user.id
        );

      return res.status(201).json({
        success: true,
        message: "Payment received successfully.",
        data: payment,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Failed to receive payment.",
      });
    }
  }

  /**
   * Get All Payments Of Booking
   */
  async getPayments(
    req: Request,
    res: Response
  ) {
    try {
      const payments =
        await paymentService.getPayments(
          String(req.params.bookingId)
        );

      return res.status(200).json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get Payment Details
   */
  async getPayment(
    req: Request,
    res: Response
  ) {
    try {
      const payment =
        await paymentService.getPayment(
          String(req.params.id)
        );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete Payment
   */
  async deletePayment(
    req: Request,
    res: Response
  ) {
    try {
      await paymentService.deletePayment(
        String(req.params.id)
      );

      return res.status(200).json({
        success: true,
        message: "Payment deleted successfully.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Download Receipt
   * (Implementation Later)
   */
  async downloadReceipt(
    req: Request,
    res: Response
  ) {
    try {
      const payment =
        await paymentService.getPayment(
          String(req.params.id)
        );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new PaymentController();