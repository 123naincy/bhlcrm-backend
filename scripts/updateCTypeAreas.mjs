import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const C_TYPE_BLOCKS = 13;

/** C Type row — positions 1–5, saleable area in Sq.Ft */
const C_TYPE_ROW_LAYOUT = [
  { unit: 1, area: 1217 },
  { unit: 2, area: 1209 },
  { unit: 3, area: 1266 },
  { unit: 4, area: 1209 },
  { unit: 5, area: 1217 },
];

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

async function updateCTypeAreas() {
  await mongoose.connect(process.env.MONGO_URI);

  const Inventory = mongoose.connection.collection(
    "inventories"
  );

  let updated = 0;

  console.log("C Type · all blocks");

  for (let block = 1; block <= C_TYPE_BLOCKS; block += 1) {
    const blockLabel = `C-${pad(block)}`;

    console.log(`\n${blockLabel}`);

    for (const rowUnit of C_TYPE_ROW_LAYOUT) {
      const inventoryNumber = `${blockLabel}-${pad(rowUnit.unit)}`;

      const result = await Inventory.updateOne(
        {
          phase: 2,
          block: "C Type",
          tower: blockLabel,
          inventoryNumber,
        },
        {
          $set: {
            area: rowUnit.area,
            areaUnit: "Sq.Ft",
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
        `  Unit ${rowUnit.unit} (2 BHK) -> ${rowUnit.area} Sq.Ft`
      );
    }
  }

  console.log(
    `\nUpdated ${updated} C Type unit(s).`
  );

  await mongoose.disconnect();
}

updateCTypeAreas().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
