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