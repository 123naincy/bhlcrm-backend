import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface IChannelPartner
  extends Document {
  partnerCode: string;

  companyName: string;

  contactPerson: string;

  mobile: string;

  alternateMobile?: string;

  email?: string;

  reraNumber?: string;

  gstNumber?: string;

  panNumber?: string;

  address: string;

  city: string;

  state: string;

  pincode: string;

  commissionType:
    | "percentage"
    | "fixed";

  commissionValue: number;

  bankName?: string;

  accountHolderName?: string;

  accountNumber?: string;

  ifscCode?: string;

  branchName?: string;

  remarks?: string;

  status:
    | "active"
    | "inactive";

  createdBy: mongoose.Types.ObjectId;
}

const ChannelPartnerSchema =
  new Schema(
    {
      partnerCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      companyName: {
        type: String,
        required: true,
        trim: true,
      },

      contactPerson: {
        type: String,
        required: true,
        trim: true,
      },

      mobile: {
        type: String,
        required: true,
        trim: true,
      },

      alternateMobile: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
        lowercase: true,
      },

      reraNumber: {
        type: String,
        default: "",
      },

      gstNumber: {
        type: String,
        default: "",
      },

      panNumber: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      state: {
        type: String,
        default: "",
      },

      pincode: {
        type: String,
        default: "",
      },

      commissionType: {
        type: String,
        enum: [
          "percentage",
          "fixed",
        ],
        default: "percentage",
      },

      commissionValue: {
        type: Number,
        default: 0,
      },

      bankName: {
        type: String,
        default: "",
      },

      accountHolderName: {
        type: String,
        default: "",
      },

      accountNumber: {
        type: String,
        default: "",
      },

      ifscCode: {
        type: String,
        default: "",
      },

      branchName: {
        type: String,
        default: "",
      },

      remarks: {
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
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

ChannelPartnerSchema.index({
  mobile: 1,
});

ChannelPartnerSchema.index({
  partnerCode: 1,
});

export default mongoose.model<IChannelPartner>(
  "ChannelPartner",
  ChannelPartnerSchema
);