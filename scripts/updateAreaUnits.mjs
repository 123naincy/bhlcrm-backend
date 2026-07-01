import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function updateAreaUnits() {
  await mongoose.connect(process.env.MONGO_URI);

  const Inventory = mongoose.connection.collection(
    "inventories"
  );

  const phase1 = await Inventory.updateMany(
    {
      phase: 1,
    },
    {
      $set: {
        areaUnit: "Sq.Yd",
        updatedAt: new Date(),
      },
    }
  );

  const phase2 = await Inventory.updateMany(
    {
      phase: 2,
    },
    {
      $set: {
        areaUnit: "Sq.Ft",
        updatedAt: new Date(),
      },
    }
  );

  console.log(
    `Phase 1: ${phase1.modifiedCount} record(s) set to Sq.Yd`
  );
  console.log(
    `Phase 2: ${phase2.modifiedCount} record(s) set to Sq.Ft`
  );

  await mongoose.disconnect();
}

updateAreaUnits().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
