import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  brandId: mongoose.Types.ObjectId;
  city: string;
  builder: string;
  propertyType: string;
  budgetRange: string;
  isActive: boolean;
}

const ProjectSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    builder: {
      type: String,
      default: "",
    },

    propertyType: {
      type: String,
      default: "",
    },

    budgetRange: {
      type: String,
      default: "",
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

export default mongoose.model<IProject>("Project", ProjectSchema);