import mongoose, {
  Schema,
  Document,
} from "mongoose";

export type TimelineEntity =
  | "inventory"
  | "booking"
  | "payment"
  | "customer"
  | "hold";

export interface ITimeline
  extends Document {
  entityType: TimelineEntity;

  entityId: mongoose.Types.ObjectId;

  inventoryId?: mongoose.Types.ObjectId;

  bookingId?: mongoose.Types.ObjectId;

  title: string;

  description: string;

  action: string;

  createdBy: mongoose.Types.ObjectId;
}

const TimelineSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: [
        "inventory",
        "booking",
        "payment",
        "customer",
        "hold",
      ],
      required: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    action: {
      type: String,
      required: true,
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

export default mongoose.model<ITimeline>(
  "Timeline",
  TimelineSchema
);