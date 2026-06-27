import mongoose, {
  Schema,
  Document,
} from "mongoose";

export type PaymentMode =
  | "cash"
  | "cheque"
  | "dd"
  | "rtgs"
  | "neft"
  | "upi"
  | "online"
  | "loan"
  | "other";

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;

  paymentScheduleId: mongoose.Types.ObjectId;

  receiptNo: string;

  amount: number;

  paymentMode: PaymentMode;

  paymentDate: Date;

  transactionNo?: string;

  chequeNo?: string;

  bankName?: string;

  branchName?: string;

  receivedBy: mongoose.Types.ObjectId;

  remarks?: string;

  receiptUrl?: string;

  createdBy: mongoose.Types.ObjectId;
}

const PaymentSchema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    paymentScheduleId: {
      type: Schema.Types.ObjectId,
      ref: "PaymentSchedule",
      required: true,
    },

    receiptNo: {
      type: String,
      required: true,
      unique: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: [
        "cash",
        "cheque",
        "dd",
        "rtgs",
        "neft",
        "upi",
        "online",
        "loan",
        "other",
      ],
      required: true,
    },

    paymentDate: {
      type: Date,
      required: true,
    },

    transactionNo: {
      type: String,
      default: "",
    },

    chequeNo: {
      type: String,
      default: "",
    },

    bankName: {
      type: String,
      default: "",
    },

    branchName: {
      type: String,
      default: "",
    },

    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiptUrl: {
      type: String,
      default: "",
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayment>(
  "Payment",
  PaymentSchema
);