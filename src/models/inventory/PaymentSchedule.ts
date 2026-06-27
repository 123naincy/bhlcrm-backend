import mongoose, {
  Schema,
  Document,
} from "mongoose";

export type PaymentScheduleStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";

export interface IPaymentSchedule
  extends Document {
  bookingId: mongoose.Types.ObjectId;

  installmentNo: number;

  title: string;

  dueDate: Date;

  amount: number;

  paidAmount: number;

  balanceAmount: number;

  status: PaymentScheduleStatus;

  remarks?: string;

  createdBy: mongoose.Types.ObjectId;
}

const PaymentScheduleSchema =
  new Schema(
    {
      bookingId: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
      },

      installmentNo: {
        type: Number,
        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      dueDate: {
        type: Date,
        required: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      paidAmount: {
        type: Number,
        default: 0,
      },

      balanceAmount: {
        type: Number,
        required: true,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "partial",
          "paid",
          "overdue",
          "cancelled",
        ],
        default: "pending",
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

export default mongoose.model<IPaymentSchedule>(
  "PaymentSchedule",
  PaymentScheduleSchema
);