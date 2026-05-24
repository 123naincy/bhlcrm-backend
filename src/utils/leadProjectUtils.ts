export const extractProjectName = (
  doc: any
): string => {
  if (!doc) return "";

  const direct =
    typeof doc.projectName === "string"
      ? doc.projectName.trim()
      : "";

  if (direct) return direct;

  const populated = doc.projectId;

  if (
    populated &&
    typeof populated === "object" &&
    populated.name
  ) {
    return String(populated.name).trim();
  }

  if (
    typeof doc.projectInterest === "string" &&
    doc.projectInterest.trim()
  ) {
    return doc.projectInterest.trim();
  }

  const extra = doc.extraFields || {};

  const priorityKeys = [
    "Form",
    "form",
    "Project",
    "project",
    "Project Name",
    "project name",
    "projectName",
  ];

  for (const key of priorityKeys) {
    const value = extra[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim()
    ) {
      return String(value).trim();
    }
  }

  for (const [key, value] of Object.entries(
    extra
  )) {
    const normalized = key
      .toLowerCase()
      .trim();

    if (
      normalized === "form" ||
      normalized === "project" ||
      normalized === "project name" ||
      normalized === "projectname"
    ) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim()
      ) {
        return String(value).trim();
      }
    }
  }

  return "";
};
