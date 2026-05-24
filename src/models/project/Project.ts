import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IProject
  extends Document {
  name: string;
  brandId: mongoose.Types.ObjectId;
  location?: string;
  propertyType?: string;
  description?: string;
  status: string;
  createdBy: mongoose.Types.ObjectId;
}

const ProjectSchema =
  new Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      brandId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
      },

      location: {
        type: String,
        default: "",
      },

      propertyType: {
        type: String,
        default: "",
      },

      description: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "active",
          "inactive",
        ],
        default: "active",
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<IProject>(
  "Project",
  ProjectSchema
);