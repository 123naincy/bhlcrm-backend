require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Lead = mongoose.connection.collection("leads");

  const leads = await Lead.find({
    "extraFields.Form": { $exists: true, $ne: "" },
  }).toArray();

  let updated = 0;

  for (const lead of leads) {
    const formName = String(lead.extraFields.Form).trim();
    if (!formName) continue;

    await Lead.updateOne(
      { _id: lead._id },
      { $set: { projectName: formName } }
    );
    updated += 1;
  }

  console.log("Updated", updated, "leads");

  const sample = await Lead.findOne({
    projectName: { $exists: true, $ne: "" },
  });
  console.log("Sample:", sample?.fullName, "->", sample?.projectName);

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
