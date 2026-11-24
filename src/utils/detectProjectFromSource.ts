import LeadSourceMapping from "../models/source/LeadSourceMapping";

export const detectProjectFromSource =
  async (
    sourceType: string,
    identifier: string,
    brandId: string
  ) => {
    if (
      !sourceType ||
      !identifier ||
      !brandId
    ) {
      return null;
    }

    const mapping =
      await LeadSourceMapping.findOne({
        sourceType,
        identifier,
        brandId,
        status: "active",
      });

    if (!mapping) {
      return null;
    }

    return {
      projectId:
        mapping.projectId,
      projectName:
        mapping.projectName,
    };
  };

  export const detectMetaLeadMapping = async (
  formId: string
) => {
  if (!formId) {
    return null;
  }

  const mappings = await LeadSourceMapping.find({
    sourceType: "meta_form",
    identifier: formId,
    status: "active",
  })
    .limit(2)
    .lean();

  if (mappings.length !== 1) {
    console.error(
      "Invalid or ambiguous Meta Form mapping:",
      formId,
      "Matches:",
      mappings.length
    );

    return null;
  }

  const mapping = mappings[0];

  return {
    brandId: mapping.brandId,
    projectId: mapping.projectId,
    projectName: mapping.projectName,
  };
};
// Detect brand and project for website landing page leads
export const detectWebsiteLeadMapping = async (
  identifier: string
) => {
  if (!identifier || typeof identifier !== "string") {
    return null;
  }

  const mappings = await LeadSourceMapping.find({
    sourceType: "landing_page",
    identifier: identifier.trim(),
    status: "active",
  })
    .limit(2)
    .lean();

  if (mappings.length !== 1) {
    console.error(
      "Invalid or ambiguous Website Lead mapping:",
      identifier,
      "Matches:",
      mappings.length
    );

    return null;
  }

  const mapping = mappings[0];

  return {
    brandId: mapping.brandId,
    projectId: mapping.projectId,
    projectName: mapping.projectName,
  };
};