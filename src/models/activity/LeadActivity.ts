import mongoose, { Schema, Document } from "mongoose";

export interface ILeadActivity extends Document {
  leadId: mongoose.Types.ObjectId;
  actionType: string;
  oldValue?: string;
  newValue?: string;
  note?: string;
  performedBy: mongoose.Types.ObjectId;
}

const LeadActivitySchema: Schema = new Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    actionType: {
      type: String,
      enum: [
        "lead_created",
        "lead_reassigned",
        "status_updated",
        "temperature_updated",
        "followup_updated",
        "notes_updated",
      ],
      required: true,
    },

    oldValue: {
      type: String,
      default: "",
    },

    newValue: {
      type: String,
      default: "",
    },

    note: {
      type: String,
      default: "",
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ILeadActivity>(
  "LeadActivity",
  LeadActivitySchema
);