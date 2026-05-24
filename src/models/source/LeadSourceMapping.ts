import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface ILeadSourceMapping
  extends Document {
  sourceType: string;

  identifier: string;

  projectId: mongoose.Types.ObjectId;

  projectName: string;

  brandId: mongoose.Types.ObjectId;

  status: string;

  createdBy: mongoose.Types.ObjectId;
}

const LeadSourceMappingSchema =
  new Schema(
    {
      sourceType: {
        type: String,
        enum: [
          "meta_form",
          "website",
          "landing_page",
          "google_campaign",
          "api",
          "magicbricks",
          "99acres",
          "housing",
        ],
        required: true,
      },

      identifier: {
        type: String,
        required: true,
        trim: true,
      },

      projectId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
      },

      projectName: {
        type: String,
        required: true,
      },

      brandId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
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

export default mongoose.model<ILeadSourceMapping>(
  "LeadSourceMapping",
  LeadSourceMappingSchema
);