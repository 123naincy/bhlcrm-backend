export const SCHEDULE_STATUSES = [
  "site_visit_scheduled",
  "office_meeting_scheduled",
  "virtual_meeting_scheduled",
] as const;

export function requiresScheduleDate(
  status?: string
) {
  if (!status) return false;

  return SCHEDULE_STATUSES.includes(
    status as (typeof SCHEDULE_STATUSES)[number]
  );
}

export function getScheduledDate(
  lead: {
    extraFields?: {
      scheduledDate?: string;
    };
  } | null
) {
  return lead?.extraFields?.scheduledDate || "";
}

export function isDateToday(
  value?: string
) {
  if (!value) return false;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

export function mapLeadScheduleFields(
  lead: any
) {
  const doc = lead.toObject
    ? lead.toObject()
    : lead;

  return {
    _id: doc._id,
    fullName: doc.fullName,
    phone: doc.phone,
    status: doc.status,
    temperature: doc.temperature,
    scheduledDate: getScheduledDate(doc),
    updatedAt: doc.updatedAt,
  };
}
