import mongoose, {
  Schema,
  Document,
} from "mongoose";

export type DocumentEntity =
  | "inventory"
  | "booking"
  | "customer"
  | "payment"
  | "channel_partner";

export type DocumentType =
  | "aadhaar"
  | "pan"
  | "gst"
  | "photo"
  | "booking_form"
  | "agreement"
  | "registry"
  | "payment_receipt"
  | "cheque"
  | "bank_slip"
  | "other";

export interface IDocument extends Document {
  entityType: DocumentEntity;

  entityId: mongoose.Types.ObjectId;

  documentType: DocumentType;

  title: string;

  fileName: string;

  fileUrl: string;

  fileSize?: number;

  mimeType?: string;

  remarks?: string;

  uploadedBy: mongoose.Types.ObjectId;
}

const DocumentSchema = new Schema(
  {
    entityType: {
      type: String,
      enum: [
        "inventory",
        "booking",
        "customer",
        "payment",
        "channel_partner",
      ],
      required: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    documentType: {
      type: String,
      enum: [
        "aadhaar",
        "pan",
        "gst",
        "photo",
        "booking_form",
        "agreement",
        "registry",
        "payment_receipt",
        "cheque",
        "bank_slip",
        "other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    mimeType: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({
  entityType: 1,
  entityId: 1,
});

export default mongoose.model<IDocument>(
  "Document",
  DocumentSchema
);