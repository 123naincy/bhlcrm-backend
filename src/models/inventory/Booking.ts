import mongoose, {
  Schema,
  Document,
} from "mongoose";

export type PaymentPlan =
  | "down_payment"
  | "flexi"
  | "50_50"
  | "clp"
  | "construction_linked"
  | "loan"
  | "other";

export interface IBooking extends Document {
  inventoryId: mongoose.Types.ObjectId;

  customerId: mongoose.Types.ObjectId;

  salesExecutive: string;

  channelPartner?: string;

  salesExecutiveCommission?: number;

  channelPartnerCommission?: number;

  referralSource?: string;

  bookingSource?: string;

  paymentPlan: PaymentPlan;

  basePrice: number;

  plcAmount: number;

  edcIdc: number;

  ifms: number;

  clubCharges: number;

  parkingCharges: number;

  otherCharges: number;

  discount: number;

  gst: number;

  totalSaleValue: number;

  bookingAmount: number;

  bookingDate: Date;

  registryDate?: Date;

  remarks?: string;

  createdBy: mongoose.Types.ObjectId;
  status?: string;
}

const BookingSchema = new Schema(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      unique: true,
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    salesExecutive: {
      type: String,
      required: true,
      trim: true,
    },

    channelPartner: {
      type: String,
      default: "",
      trim: true,
    },

    salesExecutiveCommission: {
      type: Number,
      default: 0,
    },

    channelPartnerCommission: {
      type: Number,
      default: 0,
    },

    referralSource: {
      type: String,
      default: "",
      trim: true,
    },

    bookingSource: {
      type: String,
      default: "",
      trim: true,
    },

    paymentPlan: {
      type: String,
      enum: [
        "down_payment",
        "flexi",
        "50_50",
        "clp",
        "construction_linked",
        "loan",
        "other",
      ],
      required: true,
    },

    basePrice: {
      type: Number,
      required: true,
    },

    plcAmount: {
      type: Number,
      default: 0,
    },

    edcIdc: {
      type: Number,
      default: 0,
    },

    ifms: {
      type: Number,
      default: 0,
    },

    clubCharges: {
      type: Number,
      default: 0,
    },

    parkingCharges: {
      type: Number,
      default: 0,
    },

    otherCharges: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    gst: {
      type: Number,
      default: 0,
    },

    totalSaleValue: {
      type: Number,
      required: true,
    },

    bookingAmount: {
      type: Number,
      default: 0,
    },

    bookingDate: {
      type: Date,
      required: true,
    },

    registryDate: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBooking>(
  "Booking",
  BookingSchema
);