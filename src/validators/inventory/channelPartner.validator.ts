import { z } from "zod";

export const ChannelPartnerSchema = z.object({
  partnerCode: z
    .string()
    .trim()
    .min(2, "Partner Code is required"),

  companyName: z
    .string()
    .trim()
    .min(2, "Company Name is required"),

  contactPerson: z
    .string()
    .trim()
    .min(2, "Contact Person is required"),

  mobile: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Invalid Mobile Number"
    ),

  alternateMobile: z
    .string()
    .optional(),

  email: z
    .string()
    .email("Invalid Email")
    .optional()
    .or(z.literal("")),

  reraNumber: z
    .string()
    .optional(),

  gstNumber: z
    .string()
    .optional(),

  panNumber: z
    .string()
    .regex(
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      "Invalid PAN Number"
    )
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .min(5, "Address is required"),

  city: z
    .string()
    .min(2, "City is required"),

  state: z
    .string()
    .min(2, "State is required"),

  pincode: z
    .string()
    .regex(
      /^[1-9][0-9]{5}$/,
      "Invalid Pincode"
    ),

  commissionType: z.enum([
    "percentage",
    "fixed",
  ]),

  commissionValue: z
    .number({
      message: "Commission must be a number",
    })
    .min(0),

  bankName: z
    .string()
    .optional(),

  accountHolderName: z
    .string()
    .optional(),

  accountNumber: z
    .string()
    .optional(),

  ifscCode: z
    .string()
    .regex(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      "Invalid IFSC Code"
    )
    .optional()
    .or(z.literal("")),

  branchName: z
    .string()
    .optional(),

  remarks: z
    .string()
    .optional(),
});

export type ChannelPartnerInput = z.infer<
  typeof ChannelPartnerSchema
>;