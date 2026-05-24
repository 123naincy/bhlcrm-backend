import mongoose from "mongoose";

const followUpSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    noteType: {
      type: String,
      enum: [
        "call",
        "meeting",
        "site_visit",
        "whatsapp",
        "email",
      ],
      required: true,
    },

    note: {
      type: String,
      required: true,
    },

    nextFollowUp: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "FollowUp",
  followUpSchema
);