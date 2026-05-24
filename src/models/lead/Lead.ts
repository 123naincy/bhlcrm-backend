import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface ILead
  extends Document {
  fullName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;

  brandId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  projectName?: string;
  assignedTo?: mongoose.Types.ObjectId;
  assignedBy?: mongoose.Types.ObjectId;

  source: string;
  sourceType?: string;
  identifier?: string;
  campaignName?: string;
  adSetName?: string;
  adName?: string;
  keyword?: string;

  city: string;
  budget?: string;
  propertyType?: string;

  status: string;
  temperature: string;

  followUpDate?: Date;
  notes?: string;

  isDuplicate: boolean;

  extraFields?: Record<
    string,
    any
  >;
}

const LeadSchema: Schema =
  new Schema(
    {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },

      alternatePhone: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
        lowercase: true,
        trim: true,
      },

      brandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
        required: true,
      },

      websiteId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Website",
      },

      projectId: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },

      projectName: {
        type: String,
        default: "",
      },

      sourceType: {
        type: String,
        default: "",
      },

      identifier: {
        type: String,
        default: "",
      },

      assignedTo: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      assignedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      source: {
        type: String,
        enum: [
          "website",
          "facebook_ads",
          "google_ads",
          "landing_page",
          "manual",
          "csv_import",
          "magicbricks",
          "99acres",
          "housing",
        ],
        required: true,
      },

      campaignName: {
        type: String,
        default: "",
      },

      adSetName: {
        type: String,
        default: "",
      },

      adName: {
        type: String,
        default: "",
      },

      keyword: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        required: true,
      },

      budget: {
        type: String,
        default: "",
      },

      propertyType: {
        type: String,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "new",
          "assigned",
          "contacted",
          "follow_up",
          "interested",
          "site_visit_scheduled",
          "site_visit_done",
          "negotiation",
          "won",
          "lost",
          "duplicate",
          "junk",
        ],
        default: "new",
      },

      temperature: {
        type: String,
        enum: [
          "hot",
          "warm",
          "cold",
        ],
        default: "cold",
      },

      followUpDate: {
        type: Date,
      },

      notes: {
        type: String,
        default: "",
      },

      isDuplicate: {
        type: Boolean,
        default: false,
      },

      extraFields: {
        type: Object,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<ILead>(
  "Lead",
  LeadSchema
);