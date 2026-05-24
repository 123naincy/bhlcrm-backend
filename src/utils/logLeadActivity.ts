import LeadActivity from "../models/activity/LeadActivity";

interface LogActivityParams {
  leadId: string;
  actionType:
    | "lead_created"
    | "lead_reassigned"
    | "status_updated"
    | "temperature_updated"
    | "followup_updated"
    | "notes_updated";
  oldValue?: string;
  newValue?: string;
  note?: string;
  performedBy: string;
}

export const logLeadActivity = async ({
  leadId,
  actionType,
  oldValue = "",
  newValue = "",
  note = "",
  performedBy,
}: LogActivityParams) => {
  try {
    await LeadActivity.create({
      leadId,
      actionType,
      oldValue,
      newValue,
      note,
      performedBy,
    });
  } catch (error) {
    console.error("Lead activity log failed:", error);
  }
};