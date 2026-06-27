import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IHold extends Document {
  inventoryId: mongoose.Types.ObjectId;

  customerName: string;

  mobile: string;

  tokenAmount: number;

  holdDate: Date;

  expiryDate: Date;

  remarks?: string;

  createdBy: mongoose.Types.ObjectId;
}

const HoldSchema = new Schema(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    tokenAmount: {
      type: Number,
      default: 0,
    },

    holdDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
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

export default mongoose.model<IHold>(
  "Hold",
  HoldSchema
);