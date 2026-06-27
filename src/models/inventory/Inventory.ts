import mongoose, {
  Schema,
  Document,
} from "mongoose";

export type InventoryStatus =
  | "available"
  | "hold"
  | "sold";

export type InventoryType =
  | "plot"
  | "shop"
  | "apartment";

export interface IInventory
  extends Document {
  projectId: mongoose.Types.ObjectId;
  phaseId: mongoose.Types.ObjectId;

  phase?: number;

  inventoryNumber: string;

  inventoryType: InventoryType;

  category: string;

  title: string;

  area: number;

  areaUnit: string;

  facing?: string;

  roadWidth?: number;

  floor?: string;

  tower?: string;

  block?: string;

  plcApplicable: boolean;

  plcAmount: number;

  basePrice: number;

  status: InventoryStatus;

  bookingId?: mongoose.Types.ObjectId;

  holdId?: mongoose.Types.ObjectId;

  remarks?: string;

  createdBy: mongoose.Types.ObjectId;
}

const InventorySchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    phaseId: {
      type: Schema.Types.ObjectId,
      ref: "Phase",
      required: true,
    },

    phase: {
      type: Number,
      default: 1,
    },

    inventoryNumber: {
      type: String,
      required: true,
      trim: true,
    },

    inventoryType: {
      type: String,
      enum: [
        "plot",
        "shop",
        "apartment",
      ],
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    area: {
      type: Number,
      required: true,
    },

    areaUnit: {
      type: String,
      default: "Sq.Yd",
    },

    facing: {
      type: String,
      default: "",
    },

    roadWidth: {
      type: Number,
      default: 0,
    },

    floor: {
      type: String,
      default: "",
    },

    tower: {
      type: String,
      default: "",
    },

    block: {
      type: String,
      default: "",
    },

    plcApplicable: {
      type: Boolean,
      default: false,
    },

    plcAmount: {
      type: Number,
      default: 0,
    },

    basePrice: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "available",
        "hold",
        "sold",
      ],
      default: "available",
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },

    holdId: {
      type: Schema.Types.ObjectId,
      ref: "Hold",
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
  },
  {
    timestamps: true,
  }
);

InventorySchema.index(
  {
    projectId: 1,
    phaseId: 1,
    inventoryNumber: 1,
  },
  {
    unique: true,
  }
);

export default mongoose.model<IInventory>(
  "Inventory",
  InventorySchema
);