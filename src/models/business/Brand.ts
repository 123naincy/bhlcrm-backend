import mongoose, { Schema, Document } from "mongoose";

export interface IBrand extends Document {
  name: string;
  logo?: string;
  isActive: boolean;
}

const BrandSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    logo: {
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

export default mongoose.model<IBrand>("Brand", BrandSchema);