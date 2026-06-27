import { z } from "zod";

export const BookingSchema = z.object({
  inventoryId: z.string().min(1, "Inventory is required"),

  customer: z.object({
    firstName: z.string().min(2),
    lastName: z.string().optional(),

    fatherOrSpouseName: z.string().min(2),

    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid Mobile"),

    alternateMobile: z.string().optional(),

    email: z
      .string()
      .email()
      .optional()
      .or(z.literal("")),

    panNumber: z
      .string()
      .regex(
        /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
      ),

    aadhaarNumber: z
      .string()
      .regex(/^\d{12}$/),

    address: z.string(),

    city: z.string(),

    state: z.string(),

    pincode: z.string(),
  }),

  salesExecutive: z
    .string()
    .trim()
    .min(1, "Sales Executive is required"),

  channelPartner: z
    .string()
    .trim()
    .optional(),

  paymentPlanId: z.string(),

  pricing: z.object({
    basePrice: z.number(),

    plcAmount: z.number(),

    edcIdc: z.number(),

    ifms: z.number(),

    clubCharges: z.number(),

    parkingCharges: z.number(),

    otherCharges: z.number(),

    discount: z.number(),

    gst: z.number(),

    totalSaleValue: z.number(),
  }),

  bookingAmount: z.number(),

  bookingDate: z.string(),

  remarks: z.string().optional(),
});