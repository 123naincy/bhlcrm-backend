import Lead from "../models/lead/Lead";

export const touchLeadUpdatedAt = async (
  leadId: string
) => {
  try {
    await Lead.findByIdAndUpdate(leadId, {
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("touchLeadUpdatedAt failed:", error);
  }
};
