import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const BUILDING_KEYS = {
  "Building One": "B1",
  "Building Two": "B2",
};

/** Building upper floors — same layout on 1F/2F/3F */
const BUILDING_UPPER_FLOOR_LAYOUT = [
  { category: "1 BLK", area: 292, suffix: "BLK-01" },
  { category: "1 BLK", area: 292, suffix: "BLK-02" },
  { category: "1 BLK", area: 295, suffix: "BLK-03" },
  { category: "1 BLK", area: 295, suffix: "BLK-04" },
  { category: "1 BHK", area: 428, suffix: "1BHK-01" },
  { category: "1 BHK", area: 450, suffix: "1BHK-02" },
  { category: "1 BLK", area: 294, suffix: "BLK-05" },
  { category: "1 BLK", area: 292, suffix: "BLK-06" },
  { category: "1 BLK", area: 292, suffix: "BLK-07" },
  { category: "1 BLK", area: 292, suffix: "BLK-08" },
  { category: "1 BLK", area: 292, suffix: "BLK-09" },
  { category: "1 BLK", area: 292, suffix: "BLK-10" },
  { category: "1 BLK", area: 292, suffix: "BLK-11" },
  { category: "1 BLK", area: 294, suffix: "BLK-12" },
  { category: "1 BHK", area: 450, suffix: "1BHK-03" },
  { category: "1 BHK", area: 428, suffix: "1BHK-04" },
  { category: "1 BLK", area: 295, suffix: "BLK-13" },
];

const UPPER_FLOORS = [
  {
    name: "First Floor",
    floorKey: "1F",
    positionStart: 101,
  },
  {
    name: "Second Floor",
    floorKey: "2F",
    positionStart: 201,
  },
  {
    name: "Third Floor",
    floorKey: "3F",
    positionStart: 301,
  },
];

async function updateBuildingUpperFloorAreas() {
  await mongoose.connect(process.env.MONGO_URI);

  const Inventory = mongoose.connection.collection(
    "inventories"
  );

  let updated = 0;

  for (const [buildingName, buildingKey] of Object.entries(
    BUILDING_KEYS
  )) {
    for (const floor of UPPER_FLOORS) {
      console.log(`\n${buildingName} · ${floor.name}`);

      for (const [index, unit] of BUILDING_UPPER_FLOOR_LAYOUT.entries()) {
        const position = floor.positionStart + index;
        const inventoryNumber = `${buildingKey}-${floor.floorKey}-${unit.suffix}`;

        const result = await Inventory.updateOne(
          {
            phase: 2,
            block: buildingName,
            floor: floor.name,
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
  }

  console.log(
    `\nUpdated ${updated} upper-floor unit(s).`
  );

  await mongoose.disconnect();
}

updateBuildingUpperFloorAreas().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
