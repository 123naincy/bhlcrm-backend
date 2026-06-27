import { z } from "zod";

export const HoldSchema = z.object({
  inventoryId: z
    .string()
    .trim()
    .min(1, "Inventory is required"),

  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required"),

  mobile: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Invalid mobile number"
    ),

  tokenAmount: z
    .number({
      message: "Token amount must be a number",
    })
    .min(0),

  holdDate: z
    .string()
    .datetime("Invalid hold date"),

  expiryDate: z
    .string()
    .datetime("Invalid expiry date"),

  remarks: z
    .string()
    .optional(),
});

export type HoldInput = z.infer<
  typeof HoldSchema
>;
