import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const E_TYPE_CLUSTERS = 4;

/** E Type row — units 1–8, saleable area in Sq.Ft */
const E_TYPE_ROW_LAYOUT = [
  { unit: 1, area: 1268 },
  { unit: 2, area: 1260.5 },
  { unit: 3, area: 1301 },
  { unit: 4, area: 1230 },
  { unit: 5, area: 1268 },
  { unit: 6, area: 1330 },
  { unit: 7, area: 1289.5 },
  { unit: 8, area: 1268 },
];

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

async function updateETypeAreas() {
  await mongoose.connect(process.env.MONGO_URI);

  const Inventory = mongoose.connection.collection(
    "inventories"
  );

  let updated = 0;

  console.log("E Type · all clusters");

  for (let cluster = 1; cluster <= E_TYPE_CLUSTERS; cluster += 1) {
    const clusterLabel = `E${cluster}`;

    console.log(`\n${clusterLabel}`);

    for (const rowUnit of E_TYPE_ROW_LAYOUT) {
      const inventoryNumber = `${clusterLabel}-${pad(rowUnit.unit)}`;

      const result = await Inventory.updateOne(
        {
          phase: 2,
          block: "E Type",
          tower: clusterLabel,
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
    `\nUpdated ${updated} E Type unit(s).`
  );

  await mongoose.disconnect();
}

updateETypeAreas().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
