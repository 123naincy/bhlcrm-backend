import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const COMMERCIAL_SHOPS = 9;

const COMMERCIAL_FLOORS = [
  {
    name: "Ground Floor",
    key: "GF",
    category: "Shop",
    area: 317.5,
  },
  {
    name: "First Floor",
    key: "1F",
    category: "1 BLK",
    area: 318,
  },
];

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

async function updateCommercialShops() {
  await mongoose.connect(process.env.MONGO_URI);

  const Inventory = mongoose.connection.collection(
    "inventories"
  );

  const sample = await Inventory.findOne({
    phase: 2,
    block: "Commercial",
  });

  if (!sample) {
    throw new Error(
      "No Commercial units found. Run seedPhase2Units.mjs first."
    );
  }

  let updated = 0;
  let inserted = 0;

  for (const floor of COMMERCIAL_FLOORS) {
    console.log(`\nCommercial · ${floor.name}`);

    for (let i = 1; i <= COMMERCIAL_SHOPS; i += 1) {
      const inventoryNumber = `COM-${floor.key}-${pad(i)}`;
      const legacyNumber = `COM-${pad(i)}`;

      const updateFields = {
        inventoryNumber,
        title: `${floor.name} Shop ${pad(i)}`,
        inventoryType: "shop",
        category: floor.category,
        phase: 2,
        block: "Commercial",
        floor: floor.name,
        area: floor.area,
        areaUnit: "Sq.Ft",
        floorPosition: i,
        updatedAt: new Date(),
      };

      const legacyResult =
        floor.key === "GF"
          ? await Inventory.updateOne(
              {
                phase: 2,
                block: "Commercial",
                inventoryNumber: legacyNumber,
              },
              { $set: updateFields }
            )
          : { matchedCount: 0, modifiedCount: 0 };

      if (legacyResult.matchedCount > 0) {
        updated += legacyResult.modifiedCount;
        console.log(
          `  ${i}. ${floor.category} -> ${floor.area} Sq.Ft (${legacyNumber} -> ${inventoryNumber})`
        );
        continue;
      }

      const result = await Inventory.updateOne(
        {
          phase: 2,
          block: "Commercial",
          inventoryNumber,
        },
        { $set: updateFields },
        { upsert: false }
      );

      if (result.matchedCount > 0) {
        updated += result.modifiedCount;
        console.log(
          `  ${i}. ${floor.category} -> ${floor.area} Sq.Ft (${inventoryNumber})`
        );
        continue;
      }

      await Inventory.insertOne({
        ...updateFields,
        projectId: sample.projectId,
        phaseId: sample.phaseId,
        plcApplicable: false,
        plcAmount: 0,
        basePrice: sample.basePrice ?? 4500000,
        status: "available",
        createdBy: sample.createdBy,
        createdAt: new Date(),
      });

      inserted += 1;
      console.log(
        `  ${i}. ${floor.category} -> ${floor.area} Sq.Ft (${inventoryNumber}) [inserted]`
      );
    }
  }

  const stale = await Inventory.deleteMany({
    phase: 2,
    block: "Commercial",
    inventoryNumber: {
      $regex: /^COM-\d{2}$/,
    },
  });

  if (stale.deletedCount > 0) {
    console.log(
      `\nRemoved ${stale.deletedCount} legacy Commercial record(s).`
    );
  }

  console.log(
    `\nUpdated ${updated}, inserted ${inserted} Commercial shop(s).`
  );

  await mongoose.disconnect();
}

updateCommercialShops().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
