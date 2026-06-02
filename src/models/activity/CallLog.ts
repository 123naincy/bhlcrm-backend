import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface ICallLog
  extends Document {
  leadId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;

  phone: string;

  callType:
    | "INCOMING"
    | "OUTGOING"
    | "MISSED";

  duration: number;

  recordingUrl?: string;

  callDate: Date;
}

const CallLogSchema = new Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    callType: {
      type: String,
      enum: [
        "INCOMING",
        "OUTGOING",
        "MISSED",
      ],
      required: true,
    },

    duration: {
      type: Number,
      default: 0,
    },

    recordingUrl: {
      type: String,
      default: "",
    },

    callDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICallLog>(
  "CallLog",
  CallLogSchema
);