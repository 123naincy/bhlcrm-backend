import mongoose from "mongoose";

import Booking, {
  IBooking,
  PaymentPlan,
} from "../../models/inventory/Booking";

import Hold from "../../models/inventory/Hold";

import customerService from "./customer.service";
import inventoryService from "./inventory.service";
import paymentScheduleService from "./paymentSchedule.service";
import documentService from "./document.service";
import paymentService from "./payment.service";
import timelineService from "./timeline.service";
import {
  ParsedBookingPayload,
} from "../../utils/parseBookingPayload";

class BookingService {
  /**
   * Create Booking
   */
  async createBooking(
    data: ParsedBookingPayload,
    userId: string
  ) {
    if (!data.inventoryId) {
      throw new Error(
        "Inventory is required."
      );
    }

    if (!data.salesExecutive) {
      throw new Error(
        "Sales Executive is required."
      );
    }

    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const inventory =
        await inventoryService.validateForBooking(
          data.inventoryId
        );

      if (
        inventory.status === "hold" &&
        inventory.holdId
      ) {
        await Hold.deleteOne(
          {
            _id: inventory.holdId,
          },
          { session }
        );
      }

      const customerCode =
        await customerService.generateCustomerCode();

      const customer =
        await customerService.createCustomer(
          {
            ...data.customer,
            customerCode,
            createdBy: new mongoose.Types.ObjectId(
              userId
            ),
          },
          session
        );

      const paymentPlan =
        (data.paymentPlan === "custom"
          ? "other"
          : data.paymentPlan) as PaymentPlan;

      const booking = await Booking.create(
        [
          {
            inventoryId:
              inventory._id,

            customerId:
              customer._id,

            salesExecutive:
              data.salesExecutive,

            channelPartner:
              data.channelPartner,

            salesExecutiveCommission:
              data.salesExecutiveCommission,

            channelPartnerCommission:
              data.channelPartnerCommission,

            referralSource:
              data.referralSource,

            bookingSource:
              data.bookingSource,

            paymentPlan,

            basePrice:
              data.pricing.basePrice,

            plcAmount:
              data.pricing.plcAmount,

            edcIdc:
              data.pricing.edcIdc,

            ifms:
              data.pricing.ifms,

            clubCharges:
              data.pricing.clubCharges,

            parkingCharges:
              data.pricing.parkingCharges,

            otherCharges:
              data.pricing.otherCharges,

            discount:
              data.pricing.discount,

            gst:
              data.pricing.gst,

            totalSaleValue:
              data.pricing.totalSaleValue,

            bookingAmount:
              data.bookingAmount,

            bookingDate: new Date(
              data.bookingDate
            ),

            remarks:
              data.remarks,

            createdBy:
              new mongoose.Types.ObjectId(
                userId
              ),
          },
        ],
        {
          session,
        }
      );

      const bookingData: IBooking =
        booking[0];

      let scheduleItems =
        data.schedules as Array<{
          installmentNo: number;
          title: string;
          amount: number;
        }>;

      if (
        !scheduleItems.length &&
        data.firstPayment.amount > 0
      ) {
        scheduleItems = [
          {
            installmentNo: 1,
            title: "First Payment",
            amount:
              data.pricing.totalSaleValue ||
              data.firstPayment.amount,
          },
        ];
      }

      const schedules =
        await paymentScheduleService.generateFromSchedules(
          bookingData._id.toString(),

          scheduleItems,

          new Date(
            bookingData.bookingDate
          ),

          userId,

          session
        );

      if (
        data.firstPayment.amount > 0 &&
        schedules.length
      ) {
        await paymentService.createPayment(
          {
            bookingId:
              bookingData._id,

            paymentScheduleId:
              schedules[0]._id,

            amount:
              data.firstPayment.amount,

            paymentMode:
              data.firstPayment
                .paymentMode as any,

            paymentDate: new Date(
              data.firstPayment
                .paymentDate
            ),

            transactionNo:
              data.firstPayment.transactionNo,

            bankName:
              data.firstPayment.bankName,

            remarks:
              data.firstPayment.remarks,
          },

          userId,

          session
        );
      }

      await inventoryService.markSold(
        inventory._id,
        bookingData._id
      );

      await timelineService.createTimeline(
        {
          entityType:
            "booking",

          entityId:
            bookingData._id,

          inventoryId:
            inventory._id,

          bookingId:
            bookingData._id,

          title:
            "Booking Created",

          description: `Booking created for ${customer.firstName} ${customer.lastName || ""}`.trim(),

          action:
            "booking_created",

          createdBy:
            new mongoose.Types.ObjectId(
              userId
            ),
        },

        session
      );

      await session.commitTransaction();

      return bookingData;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Booking Details
   */
  async getBookingById(id: string) {
    const booking =
      await Booking.findById(id)
        .populate("customerId")
        .populate("inventoryId");

    if (!booking) {
      return null;
    }

    return this.formatBooking(booking);
  }

  /**
   * Booking by inventory plot
   */
  async getBookingByInventoryId(
    inventoryId: string
  ) {
    const booking =
      await Booking.findOne({
        inventoryId,
      })
        .populate("customerId")
        .populate("inventoryId");

    if (!booking) {
      return null;
    }

    return this.formatBooking(booking);
  }

  /**
   * Booking List
   */
  async getBookings() {
    const bookings =
      await Booking.find()
        .populate("customerId")
        .populate("inventoryId")
        .sort({
          createdAt: -1,
        });

    return Promise.all(
      bookings.map((booking) =>
        this.formatBooking(booking)
      )
    );
  }

  async formatBooking(booking: any) {
    const bookingId =
      booking._id.toString();

    const [
      payments,
      schedules,
      timeline,
      documents,
    ] = await Promise.all([
      paymentService.getPayments(
        bookingId
      ),

      paymentScheduleService.getByBooking(
        bookingId
      ),

      timelineService.getBookingTimeline(
        bookingId
      ),

      documentService.getByEntity(
        "booking",
        bookingId
      ),
    ]);

    const scheduleMap = new Map(
      schedules.map((schedule) => [
        schedule._id.toString(),
        schedule,
      ])
    );

    const receivedAmount =
      payments.reduce(
        (sum, payment) =>
          sum + payment.amount,
        0
      );

    const customer =
      booking.customerId || {};

    const inventory =
      booking.inventoryId || {};

    const totalSaleValue =
      booking.totalSaleValue || 0;

    return {
      _id: bookingId,

      bookingNo: `BK-${bookingId
        .slice(-6)
        .toUpperCase()}`,

      bookingDate: booking.bookingDate,

      status:
        booking.status || "active",

      remarks: booking.remarks || "",

      registryDate:
        booking.registryDate || null,

      customer: {
        _id: String(customer._id || ""),

        firstName:
          customer.firstName || "",

        lastName:
          customer.lastName || "",

        mobile: customer.mobile || "",

        email: customer.email || "",

        pan:
          customer.panNumber || "",

        aadhaar:
          customer.aadhaarNumber || "",

        address: [
          customer.address,
          customer.city,
          customer.state,
          customer.pincode,
        ]
          .filter(Boolean)
          .join(", "),
      },

      inventory: {
        _id: String(inventory._id || ""),

        plotNo:
          inventory.inventoryNumber ||
          inventory.title ||
          "",

        phase: inventory.phase || 1,

        area: inventory.area || 0,

        areaUnit:
          inventory.areaUnit ||
          "Sq.Yd",

        type:
          inventory.inventoryType ||
          "plot",
      },

      totalSaleValue,

      receivedAmount,

      pendingAmount: Math.max(
        totalSaleValue -
          receivedAmount,
        0
      ),

      salesExecutive:
        booking.salesExecutive || "",

      salesExecutiveCommission:
        booking.salesExecutiveCommission ||
        0,

      channelPartner:
        booking.channelPartner || "",

      channelPartnerCommission:
        booking.channelPartnerCommission ||
        0,

      paymentPlan: {
        type:
          booking.paymentPlan ||
          "other",

        schedules: schedules.map(
          (schedule) => ({
            _id: String(
              schedule._id
            ),

            installmentNo:
              schedule.installmentNo,

            title: schedule.title,

            dueDate: schedule.dueDate,

            percentage:
              totalSaleValue > 0
                ? Math.round(
                    (schedule.amount /
                      totalSaleValue) *
                      100
                  )
                : 0,

            amount: schedule.amount,

            paidAmount:
              schedule.paidAmount ||
              0,

            status:
              schedule.status ||
              "pending",
          })
        ),
      },

      payments: payments.map(
        (payment) => {
          const schedule =
            scheduleMap.get(
              payment.paymentScheduleId?.toString() ||
                ""
            );

          return {
            _id: String(payment._id),

            installmentNo:
              schedule?.installmentNo,

            amount: payment.amount,

            paymentDate:
              payment.paymentDate,

            paymentMode:
              payment.paymentMode,

            transactionNo:
              payment.transactionNo ||
              "",

            bankName:
              payment.bankName || "",

            receiptNo:
              payment.receiptNo || "",

            receiptUrl:
              payment.receiptUrl ||
              "",

            remarks:
              payment.remarks || "",

            status: "received" as const,
          };
        }
      ),

      timeline: timeline.map(
        (item) => {
          const createdBy =
            item.createdBy as any;

          return {
            _id: String(item._id),

            title: item.title,

            description:
              item.description || "",

            action: item.action,

            createdAt: (item as any)
              .createdAt,

            createdBy: createdBy
              ? {
                  name:
                    createdBy.fullName ||
                    createdBy.name ||
                    "System",
                }
              : undefined,
          };
        }
      ),

      documents: documents.map(
        (doc) => ({
          _id: String(doc._id),

          name: doc.title,

          type: doc.documentType,

          fileUrl: doc.fileUrl,

          uploadedAt: (doc as any)
            .createdAt,
        })
      ),

      pricing: {
        basePrice:
          booking.basePrice || 0,

        plc: booking.plcAmount || 0,

        edc: booking.edcIdc || 0,

        idc: 0,

        ifms: booking.ifms || 0,

        clubCharges:
          booking.clubCharges || 0,

        parkingCharges:
          booking.parkingCharges || 0,

        otherCharges:
          booking.otherCharges || 0,

        discount:
          booking.discount || 0,

        gst: booking.gst || 0,

        totalSaleValue,
      },
    };
  }

  /**
   * Update Booking
   */
  async updateBooking(
    id: string,
    data: any
  ) {
    const booking =
      await Booking.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
        }
      )
        .populate("customerId")
        .populate("inventoryId");

    if (!booking) {
      return null;
    }

    return this.formatBooking(booking);
  }

  async cancelBooking(
    id: string,
    userId: string
  ) {
    const booking =
      await Booking.findById(id);

    if (!booking) {
      throw new Error(
        "Booking not found."
      );
    }

    booking.status = "cancelled";

    await booking.save();

    await inventoryService.changeStatus(
      booking.inventoryId.toString(),
      "available"
    );

    await timelineService.createTimeline({
      bookingId: booking._id,

      inventoryId:
        booking.inventoryId,

      entityType: "booking",

      entityId: booking._id,

      title: "Booking Cancelled",

      description:
        "Booking has been cancelled.",

      action: "booking_cancelled",

      createdBy: new mongoose.Types.ObjectId(
        userId
      ),
    });

    return booking;
  }
}

export default new BookingService();
