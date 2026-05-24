import mongoose, { Schema, Document } from "mongoose";

export interface IWebsite extends Document {
  name: string;
  domain: string;
  brandId: mongoose.Types.ObjectId;
  isActive: boolean;
}

const WebsiteSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    domain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWebsite>("Website", WebsiteSchema);