import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface ICallLog extends Document {
  leadId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;

  phone: string;

  callType:
    | "INCOMING"
    | "OUTGOING"
    | "MISSED";

  callStatus:
    | "ANSWERED"
    | "NOT_ANSWERED"
    | "MISSED"
    | "REJECTED";

  duration: number;

  recordingUrl?: string;

  summary?: string;

  summaryStatus:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED";

  callDate: Date;
}

const CallLogSchema = new Schema(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
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

    callStatus: {
      type: String,
      enum: [
        "ANSWERED",
        "NOT_ANSWERED",
        "MISSED",
        "REJECTED",
      ],
      default: "ANSWERED",
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    recordingUrl: {
      type: String,
      default: "",
    },

    summary: {
      type: String,
      default: "",
      trim: true,
    },

    summaryStatus: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "COMPLETED",
        "FAILED",
      ],
      default: "PENDING",
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