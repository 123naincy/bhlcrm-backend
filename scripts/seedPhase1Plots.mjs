import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

/**
 * Plot Area Table, S. NO.135/1
 * Areas in Sq.Yd — Phase 1 (45 plots)
 */
const PHASE1_PLOTS = [
  { plotNo: "01", area: 387 },
  { plotNo: "02", area: 468 },
  { plotNo: "03", area: 470 },
  { plotNo: "04", area: 418 },
  { plotNo: "05", area: 477 },
  { plotNo: "06", area: 394 },
  { plotNo: "07", area: 405 },
  { plotNo: "08", area: 379 },
  { plotNo: "09", area: 376 },
  { plotNo: "10", area: 365 },
  { plotNo: "11", area: 373 },
  { plotNo: "12", area: 358 },
  { plotNo: "13", area: 363 },
  { plotNo: "14", area: 359 },
  { plotNo: "15", area: 387 },
  { plotNo: "16", area: 362 },
  { plotNo: "17", area: 361 },
  { plotNo: "18", area: 380 },
  { plotNo: "19", area: 379 },
  { plotNo: "20", area: 379 },
  { plotNo: "21", area: 377 },
  { plotNo: "22", area: 376 },
  { plotNo: "23", area: 376 },
  { plotNo: "24", area: 374 },
  { plotNo: "25", area: 374 },
  { plotNo: "26", area: 373 },
  { plotNo: "27", area: 418 },
  { plotNo: "28", area: 438 },
  { plotNo: "29", area: 370 },
  { plotNo: "30", area: 365 },
  { plotNo: "31", area: 380 },
  { plotNo: "32", area: 424 },
  { plotNo: "33", area: 389 },
  { plotNo: "34", area: 436 },
  { plotNo: "35", area: 472 },
  { plotNo: "36", area: 466 },
  { plotNo: "37", area: 480 },
  { plotNo: "38", area: 434 },
  { plotNo: "39", area: 358 },
  { plotNo: "40", area: 464 },
  { plotNo: "41", area: 613 },
  { plotNo: "42", area: 422 },
  { plotNo: "43", area: 367 },
  { plotNo: "44", area: 368 },
  { plotNo: "45", area: 376 },
];

function buildPhase1Plots() {
  return PHASE1_PLOTS.map((plot) => ({
    inventoryNumber: plot.plotNo,
    title: `Plot ${plot.plotNo}`,
    inventoryType: "plot",
    category: "Residential",
    phase: 1,
    area: plot.area,
    basePrice: plot.area * 5000,
    status: "available",
  }));
}

async function seedPhase1Plots() {
  await mongoose.connect(process.env.MONGO_URI);

  const project = await mongoose.connection
    .collection("projects")
    .findOne({ status: "active" });

  if (!project) {
    throw new Error(
      "No active project found. Create a project before seeding inventory."
    );
  }

  const Inventory = mongoose.connection.collection(
    "inventories"
  );

  const force =
    process.argv.includes("--force") ||
    process.env.FORCE === "true";

  const existingPhase1 =
    await Inventory.countDocuments({
      phase: 1,
      inventoryType: "plot",
    });

  if (
    existingPhase1 >= PHASE1_PLOTS.length &&
    !force
  ) {
    console.log(
      `Phase 1 already has ${existingPhase1} plots. Use --force to reseed.`
    );
    await mongoose.disconnect();
    return;
  }

  if (force || existingPhase1 > 0) {
    await Inventory.deleteMany({
      phase: 1,
      inventoryType: "plot",
    });
  }

  const createdBy =
    project.createdBy || project._id;

  const docs = buildPhase1Plots().map(
    (plot) => ({
      ...plot,
      projectId: project._id,
      phaseId: project._id,
      areaUnit: "Sq.Yd",
      plcApplicable: false,
      plcAmount: 0,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  );

  await Inventory.insertMany(docs);

  const totalArea = docs.reduce(
    (sum, plot) => sum + plot.area,
    0
  );

  console.log(
    `Seeded ${docs.length} Phase 1 plots for project "${project.name}".`
  );
  console.log(
    `Total area: ${totalArea} Sq.Yd`
  );

  await mongoose.disconnect();
}

seedPhase1Plots().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
