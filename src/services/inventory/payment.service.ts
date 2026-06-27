import mongoose, { ClientSession } from "mongoose";

import Payment, {
  IPayment,
} from "../../models/inventory/Payment";

import PaymentSchedule from "../../models/inventory/PaymentSchedule";
import Booking from "../../models/inventory/Booking";

import paymentScheduleService from "./paymentSchedule.service";
import timelineService from "./timeline.service";

class PaymentService {
  /**
   * Generate Receipt Number
   */
  async generateReceiptNo() {
    const count =
      await Payment.countDocuments();

    return `RC-${new Date().getFullYear()}-${String(
      count + 1
    ).padStart(6, "0")}`;
  }

  /**
   * Create Payment
   */
  async createPayment(
    data: Partial<IPayment>,
    userId: string,
    session?: ClientSession
  ) {
    const payment =
      await Payment.create(
        [
          {
            ...data,
            receiptNo:
              await this.generateReceiptNo(),
            createdBy: new mongoose.Types.ObjectId(userId),
            receivedBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        session ? { session } : {}
      );

    // Update Schedule
    await paymentScheduleService.markPaid(
      data.paymentScheduleId!.toString(),
      data.amount!,
      session
    );

    // Update Booking Summary
    await this.updateBookingSummary(
      data.bookingId!.toString(),
      session
    );

    // Timeline
    await timelineService.createTimeline(
      {
        entityType: "payment",

        entityId: payment[0]._id,

        bookingId:
          data.bookingId as any,

        title: "Payment Received",

        description: `₹${data.amount} received via ${data.paymentMode}`,

        action: "payment_received",

        createdBy: new mongoose.Types.ObjectId(userId),
      },
      session
    );

    return payment[0];
  }

  /**
   * Booking Summary
   */
  async updateBookingSummary(
    bookingId: string,
    session?: ClientSession
  ) {
    let scheduleQuery =
      PaymentSchedule.find({
        bookingId,
      });

    if (session) {
      scheduleQuery =
        scheduleQuery.session(session);
    }

    const schedules =
      await scheduleQuery;

    const received =
      schedules.reduce(
        (sum, item) =>
          sum + item.paidAmount,
        0
      );

    const pending =
      schedules.reduce(
        (sum, item) =>
          sum + item.balanceAmount,
        0
      );

    const nextDue =
      schedules.find(
        (item) =>
          item.status !== "paid"
      );

    return Booking.findByIdAndUpdate(
      bookingId,
      {
        bookingAmount: received,
      },
      {
        new: true,
        session,
      }
    );
  }

  /**
   * Payment History
   */
  async getPayments(
    bookingId: string
  ) {
    return Payment.find({
      bookingId,
    }).sort({
      paymentDate: 1,
    });
  }

  /**
   * Payment By Id
   */
  async getPayment(
    id: string
  ) {
    return Payment.findById(id);
  }

  /**
   * Delete Payment
   */
  async deletePayment(
    id: string,
    session?: ClientSession
  ) {
    const payment =
      await Payment.findById(id);

    if (!payment) {
      throw new Error(
        "Payment not found."
      );
    }

    const schedule =
      await PaymentSchedule.findById(
        payment.paymentScheduleId
      );

    if (schedule) {
      const paidAmount = Math.max(
        0,
        schedule.paidAmount -
          payment.amount
      );

      const balanceAmount =
        schedule.amount - paidAmount;

      let status:
        | "pending"
        | "partial"
        | "paid" = "partial";

      if (paidAmount <= 0) {
        status = "pending";
      } else if (
        balanceAmount <= 0
      ) {
        status = "paid";
      }

      await PaymentSchedule.findByIdAndUpdate(
        schedule._id,
        {
          paidAmount,
          balanceAmount,
          status,
        },
        { session }
      );
    }

    await Payment.findByIdAndDelete(
      id,
      { session }
    );

    await this.updateBookingSummary(
      payment.bookingId.toString(),
      session
    );

    return payment;
  }
}

export default new PaymentService();