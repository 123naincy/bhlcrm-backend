export const detectProject = (
  data: any
): string => {
  // 1 explicit project
  if (
    data.projectName &&
    data.projectName.trim()
  ) {
    return data.projectName.trim();
  }

  const campaign = (
    data.campaignName || ""
  )
    .toLowerCase()
    .trim();

  const adSet = (
    data.adSetName || ""
  )
    .toLowerCase()
    .trim();

  const adName = (
    data.adName || ""
  )
    .toLowerCase()
    .trim();

  const website = (
    data.websiteName || ""
  )
    .toLowerCase()
    .trim();

  const source = (
    data.source || ""
  )
    .toLowerCase()
    .trim();

  // BHL Studioz
  if (
    campaign.includes("bhl") ||
    campaign.includes("studioz") ||
    adSet.includes("bhl") ||
    adName.includes("studioz") ||
    website.includes("bhl") ||
    source.includes("bhl")
  ) {
    return "BHL Studioz";
  }

  // Aaryana
  if (
    campaign.includes("aaryana") ||
    adSet.includes("aaryana") ||
    adName.includes("aaryana") ||
    website.includes("aaryana") ||
    source.includes("aaryana")
  ) {
    return "Aaryana";
  }

  // Brickhill Heights
  if (
    campaign.includes("heights") ||
    campaign.includes("brickhill") ||
    adSet.includes("heights") ||
    adName.includes("heights")
  ) {
    return "Brickhill Heights";
  }

  return "";
};