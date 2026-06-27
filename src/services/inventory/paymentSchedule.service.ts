import { ClientSession, Types } from "mongoose";

import PaymentPlan from "../../models/inventory/PaymentPlan";
import PaymentSchedule from "../../models/inventory/PaymentSchedule";

class PaymentScheduleService {
  /**
   * Generate Payment Schedule
   */
  async generateSchedule(
    bookingId: string,
    paymentPlanId: string,
    totalSaleValue: number,
    bookingDate: Date,
    createdBy: string,
    session?: ClientSession
  ) {
    const paymentPlan =
      await PaymentPlan.findById(paymentPlanId);

    if (!paymentPlan) {
      throw new Error(
        "Payment Plan not found."
      );
    }

    const schedules = paymentPlan.installments.map(
      (item: any) => {
        const amount =
          (totalSaleValue *
            item.percentage) /
          100;

        const dueDate = new Date(
          bookingDate
        );

        if (item.daysAfterBooking) {
          dueDate.setDate(
            dueDate.getDate() +
              item.daysAfterBooking
          );
        }

        return {
          bookingId,

          installmentNo:
            item.sequence,

          title: item.title,

          dueDate,

          amount,

          paidAmount: 0,

          balanceAmount:
            amount,

          status: "pending",

          createdBy,
        };
      }
    );

    return await PaymentSchedule.insertMany(
      schedules,
      {
        session,
      }
    );
  }

  /**
   * Generate Payment Schedule From Frontend Data
   */
  async generateFromSchedules(
    bookingId: string,
    schedules: Array<{
      installmentNo: number;
      title: string;
      amount: number;
    }>,
    bookingDate: Date,
    createdBy: string,
    session?: ClientSession
  ) {
    if (!schedules.length) {
      return [];
    }

    const docs = schedules.map(
      (item) => ({
        bookingId: new Types.ObjectId(
          bookingId
        ),

        installmentNo:
          item.installmentNo,

        title: item.title,

        dueDate: new Date(bookingDate),

        amount: item.amount,

        paidAmount: 0,

        balanceAmount:
          item.amount,

        status: "pending",

        createdBy: new Types.ObjectId(
          createdBy
        ),
      })
    );

    return PaymentSchedule.insertMany(
      docs,
      {
        session,
      }
    );
  }

  /**
   * Get Schedule By Booking
   */
  async getByBooking(
    bookingId: string
  ) {
    return PaymentSchedule.find({
      bookingId,
    }).sort({
      installmentNo: 1,
    });
  }

  /**
   * Update Schedule
   */
  async updateSchedule(
    id: string,
    data: any,
    session?: ClientSession
  ) {
    return PaymentSchedule.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        session,
      }
    );
  }

  /**
   * Mark Installment Paid
   */
  async markPaid(
    id: string,
    amount: number,
    session?: ClientSession
  ) {
    let scheduleQuery =
      PaymentSchedule.findById(id);

    if (session) {
      scheduleQuery =
        scheduleQuery.session(session);
    }

    const schedule =
      await scheduleQuery;

    if (!schedule) {
      throw new Error(
        "Installment not found."
      );
    }

    const paidAmount =
      schedule.paidAmount + amount;

    const balanceAmount =
      schedule.amount - paidAmount;

    let status = "partial";

    if (balanceAmount <= 0) {
      status = "paid";
    }

    return PaymentSchedule.findByIdAndUpdate(
      id,
      {
        paidAmount,

        balanceAmount,

        status,
      },
      {
        new: true,
        session,
      }
    );
  }
}

export default new PaymentScheduleService();