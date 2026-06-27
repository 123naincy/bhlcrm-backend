import { z } from "zod";

export const PaymentSchema = z
  .object({
    bookingId: z
      .string()
      .trim()
      .min(1, "Booking ID is required"),

    paymentScheduleId: z
      .string()
      .trim()
      .min(1, "Payment Schedule ID is required"),

    amount: z
      .number({
        message: "Amount is required and must be a number",
      })
      .positive("Amount must be greater than 0"),

    paymentMode: z.enum(
      [
        "cash",
        "cheque",
        "dd",
        "rtgs",
        "neft",
        "upi",
        "online",
        "loan",
        "other",
      ],
      {
        message: "Payment Mode is required",
      }
    ),

    paymentDate: z
      .string()
      .datetime("Invalid Payment Date"),

    transactionNo: z
      .string()
      .trim()
      .optional(),

    chequeNo: z
      .string()
      .trim()
      .optional(),

    bankName: z
      .string()
      .trim()
      .optional(),

    branchName: z
      .string()
      .trim()
      .optional(),

    receiptNo: z
      .string()
      .trim()
      .optional(),

    receiptUrl: z
      .string()
      .url("Invalid Receipt URL")
      .optional()
      .or(z.literal("")),

    remarks: z
      .string()
      .max(1000, "Remarks cannot exceed 1000 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Cheque Validation
    if (data.paymentMode === "cheque") {
      if (!data.chequeNo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["chequeNo"],
          message: "Cheque Number is required",
        });
      }

      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "Bank Name is required",
        });
      }
    }

    // Online/RTGS/NEFT/UPI Validation
    if (
      ["rtgs", "neft", "upi", "online"].includes(
        data.paymentMode
      )
    ) {
      if (!data.transactionNo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transactionNo"],
          message: "Transaction Number is required",
        });
      }

      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "Bank Name is required",
        });
      }
    }

    // Loan Validation
    if (data.paymentMode === "loan") {
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "Loan Bank Name is required",
        });
      }
    }
  });

export type PaymentInput = z.infer<
  typeof PaymentSchema
>;