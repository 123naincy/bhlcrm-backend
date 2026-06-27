import { z } from "zod";

export const CustomerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name is required"),

  lastName: z
    .string()
    .trim()
    .optional(),

  fatherOrSpouseName: z
    .string()
    .trim()
    .min(2, "Father/Husband name is required"),

  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid mobile number"),

  alternateMobile: z
    .string()
    .optional(),

  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),

  dob: z
    .string()
    .optional(),

  occupation: z
    .string()
    .optional(),

  companyName: z
    .string()
    .optional(),

  panNumber: z
    .string()
    .regex(
      /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
      "Invalid PAN Number"
    ),

  aadhaarNumber: z
    .string()
    .regex(
      /^\d{12}$/,
      "Invalid Aadhaar Number"
    ),

  gstNumber: z
    .string()
    .optional(),

  address: z
    .string()
    .min(5),

  city: z
    .string()
    .min(2),

  state: z
    .string()
    .min(2),

  pincode: z
    .string()
    .regex(
      /^[1-9][0-9]{5}$/,
      "Invalid Pincode"
    ),

  remarks: z
    .string()
    .optional(),
});

export type CustomerInput = z.infer<
  typeof CustomerSchema
>;