function parseJsonField(value: unknown) {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<
        string,
        unknown
      >;
    } catch {
      return {};
    }
  }

  return {};
}

function mapCustomer(
  customer: Record<string, unknown>
) {
  return {
    firstName: String(
      customer.firstName || ""
    ).trim(),

    lastName: String(
      customer.lastName || ""
    ).trim(),

    fatherOrSpouseName: String(
      customer.fatherName ||
        customer.fatherOrSpouseName ||
        "NA"
    ).trim(),

    mobile: String(
      customer.mobile || ""
    ).trim(),

    alternateMobile: String(
      customer.alternateMobile || ""
    ).trim(),

    email: String(
      customer.email || ""
    ).trim(),

    panNumber: String(
      customer.pan ||
        customer.panNumber ||
        "AAAAA0000A"
    )
      .trim()
      .toUpperCase(),

    aadhaarNumber: String(
      customer.aadhaar ||
        customer.aadhaarNumber ||
        "000000000000"
    ).trim(),

    address: String(
      customer.address || "NA"
    ).trim(),

    city: String(
      customer.city || "NA"
    ).trim(),

    state: String(
      customer.state || "NA"
    ).trim(),

    pincode: String(
      customer.pincode || "000000"
    ).trim(),
  };
}

function mapPricing(
  pricing: Record<string, unknown>
) {
  const edc = Number(pricing.edc) || 0;
  const idc = Number(pricing.idc) || 0;

  return {
    basePrice:
      Number(pricing.basePrice) || 0,

    plcAmount:
      Number(pricing.plc) ||
      Number(pricing.plcAmount) ||
      0,

    edcIdc:
      Number(pricing.edcIdc) ||
      edc + idc,

    ifms: Number(pricing.ifms) || 0,

    clubCharges:
      Number(pricing.clubCharges) || 0,

    parkingCharges:
      Number(pricing.parkingCharges) || 0,

    otherCharges:
      Number(pricing.otherCharges) || 0,

    discount:
      Number(pricing.discount) || 0,

    gst: Number(pricing.gst) || 0,

    totalSaleValue:
      Number(pricing.totalSaleValue) || 0,
  };
}

export function parseBookingPayload(
  body: Record<string, unknown> = {}
) {
  const customer = parseJsonField(
    body.customer
  );

  const pricing = parseJsonField(
    body.pricing
  );

  const relationship = parseJsonField(
    body.relationship
  );

  const paymentPlanData = parseJsonField(
    body.paymentPlan
  );

  const payment = parseJsonField(
    body.payment
  );

  const paymentPlanValue =
    paymentPlanData.paymentPlan ||
    body.paymentPlan;

  const schedules =
    (paymentPlanData.schedules as unknown[]) ||
    (body.schedules as unknown[]) ||
    [];

  return {
    inventoryId: String(
      body.inventoryId || ""
    ).trim(),

    customer: mapCustomer(customer),

    pricing: mapPricing(pricing),

    relationship,

    salesExecutive: String(
      relationship.salesExecutive ||
        body.salesExecutive ||
        ""
    ).trim(),

    channelPartner: String(
      relationship.channelPartner ||
        body.channelPartner ||
        ""
    ).trim(),

    salesExecutiveCommission:
      Number(
        relationship.salesExecutiveCommission ??
          body.salesExecutiveCommission
      ) || 0,

    channelPartnerCommission:
      Number(
        relationship.channelPartnerCommission ??
          body.channelPartnerCommission
      ) || 0,

    referralSource: String(
      relationship.referralSource ||
        body.referralSource ||
        ""
    ).trim(),

    bookingSource: String(
      relationship.bookingSource ||
        body.bookingSource ||
        ""
    ).trim(),

    paymentPlan: String(
      paymentPlanValue || "down_payment"
    ),

    schedules,

    firstPayment: {
      amount: Number(payment.amount) || 0,

      paymentDate:
        String(payment.paymentDate || "") ||
        new Date().toISOString(),

      paymentMode: String(
        payment.paymentMode || "cash"
      ),

      transactionNo: String(
        payment.transactionNo || ""
      ),

      bankName: String(
        payment.bankName || ""
      ),

      chequeNo: String(
        payment.chequeNo || ""
      ),

      remarks: String(
        payment.remarks || ""
      ),
    },

    bookingAmount:
      Number(payment.amount) ||
      Number(body.bookingAmount) ||
      0,

    bookingDate:
      String(payment.paymentDate || "") ||
      new Date().toISOString(),

    remarks: String(
      body.remarks || ""
    ).trim(),
  };
}

export type ParsedBookingPayload = ReturnType<
  typeof parseBookingPayload
>;
