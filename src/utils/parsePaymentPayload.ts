function parseDate(value: unknown): Date {
  const str = String(value || "").trim();

  if (!str) {
    return new Date();
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T12:00:00.000Z`);
  }

  return new Date(str);
}

export function parsePaymentPayload(
  body: Record<string, unknown>,
  file?: Express.Multer.File
) {
  const scheduleId =
    body.paymentScheduleId ||
    body.installmentId;

  return {
    bookingId: String(
      body.bookingId || ""
    ).trim(),

    paymentScheduleId: String(
      scheduleId || ""
    ).trim(),

    amount: Number(body.amount || 0),

    paymentMode: String(
      body.paymentMode || "cash"
    ).trim(),

    paymentDate: parseDate(
      body.paymentDate
    ),

    transactionNo: String(
      body.transactionNo || ""
    ).trim(),

    chequeNo: String(
      body.chequeNo || ""
    ).trim(),

    bankName: String(
      body.bankName || ""
    ).trim(),

    remarks: String(
      body.remarks || ""
    ).trim(),

    receiptUrl: file
      ? `/uploads/${file.filename}`
      : "",
  };
}
