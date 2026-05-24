import mongoose from "mongoose";
import process from "process";
import Lead from "../models/lead/Lead";
import { extractProjectName } from "../utils/leadProjectUtils";

const backfillLeadProjectNames = async () => {
  const leads = await Lead.find({
    $or: [
      { projectName: { $exists: false } },
      { projectName: "" },
      { projectName: null },
    ],
  }).select("projectName projectId extraFields projectInterest");

  let updated = 0;

  for (const lead of leads) {
    const name = extractProjectName(lead);

    if (!name) continue;

    await Lead.updateOne(
      { _id: lead._id },
      { $set: { projectName: name } }
    );
    updated += 1;
  }

  if (updated > 0) {
    console.log(
      `Backfilled projectName on ${updated} lead(s)`
    );
  }
};

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB Connected");
    await backfillLeadProjectNames();
  } catch (error) {
    console.error("DB Connection Error:", error);
    process.exit(1);
  }
};