import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface ICustomer extends Document {
  customerCode: string;

  firstName: string;

  lastName?: string;

  fatherOrSpouseName: string;

  mobile: string;

  alternateMobile?: string;

  email?: string;

  dob?: Date;

  occupation?: string;

  companyName?: string;

  panNumber: string;

  aadhaarNumber: string;

  gstNumber?: string;

  address: string;

  city: string;

  state: string;

  pincode: string;

  remarks?: string;

  status: "active" | "inactive";

  createdBy: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema(
  {
    customerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      default: "",
      trim: true,
    },

    fatherOrSpouseName: {
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

    dob: {
      type: Date,
    },

    occupation: {
      type: String,
      default: "",
    },

    companyName: {
      type: String,
      default: "",
    },

    panNumber: {
      type: String,
      required: true,
      uppercase: true,
    },

    aadhaarNumber: {
      type: String,
      required: true,
    },

    gstNumber: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      required: true,
    },

    remarks: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
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

CustomerSchema.index({
  mobile: 1,
});

CustomerSchema.index({
  panNumber: 1,
});

CustomerSchema.index({
  aadhaarNumber: 1,
});

export default mongoose.model<ICustomer>(
  "Customer",
  CustomerSchema
);