import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const BUILDING_KEYS = {
  "Building One": "B1",
  "Building Two": "B2",
};

/**
 * Phase 2 · Ground Floor — positions 1–16 (floor plan order)
 * category + area in Sq.Ft
 */
const GROUND_FLOOR_LAYOUT = [
  { category: "1 BLK", area: 255, suffix: "BLK-01" },
  { category: "1 BLK", area: 255, suffix: "BLK-02" },
  { category: "1 BLK", area: 255, suffix: "BLK-03" },
  { category: "1 BLK", area: 255, suffix: "BLK-04" },
  { category: "1 BHK", area: 390, suffix: "1BHK-01" },
  { category: "1 BHK", area: 413, suffix: "1BHK-02" },
  { category: "1 BLK", area: 255, suffix: "BLK-05" },
  { category: "1 BLK", area: 255, suffix: "BLK-06" },
  { category: "1 BLK", area: 255, suffix: "BLK-07" },
  { category: "1 BLK", area: 255, suffix: "BLK-08" },
  { category: "1 BLK", area: 255, suffix: "BLK-09" },
  { category: "1 BLK", area: 255, suffix: "BLK-10" },
  { category: "1 BLK", area: 255, suffix: "BLK-11" },
  { category: "1 BHK", area: 413, suffix: "1BHK-03" },
  { category: "1 BHK", area: 390, suffix: "1BHK-04" },
  { category: "1 BLK", area: 255, suffix: "BLK-12" },
];

async function updatePhase2GroundFloorAreas() {
  await mongoose.connect(process.env.MONGO_URI);

  const Inventory = mongoose.connection.collection(
    "inventories"
  );

  let updated = 0;

  for (const [buildingName, buildingKey] of Object.entries(
    BUILDING_KEYS
  )) {
    console.log(`\n${buildingName} · Ground Floor`);

    for (const [index, unit] of GROUND_FLOOR_LAYOUT.entries()) {
      const position = index + 1;
      const inventoryNumber = `${buildingKey}-GF-${unit.suffix}`;

      const result = await Inventory.updateOne(
        {
          phase: 2,
          block: buildingName,
          floor: "Ground Floor",
          inventoryNumber,
        },
        {
          $set: {
            area: unit.area,
            areaUnit: "Sq.Ft",
            floorPosition: position,
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        console.warn(
          `  No unit found: ${inventoryNumber}`
        );
        continue;
      }

      updated += result.modifiedCount;
      console.log(
        `  ${position}. ${unit.category} -> ${unit.area} Sq.Ft (${inventoryNumber})`
      );
    }
  }

  console.log(
    `\nUpdated ${updated} Phase 2 Ground Floor unit(s).`
  );

  await mongoose.disconnect();
}

updatePhase2GroundFloorAreas().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
