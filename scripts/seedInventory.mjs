import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const samplePlots = [
  {
    inventoryNumber: "P-101",
    title: "Plot 101",
    inventoryType: "plot",
    category: "Residential",
    area: 120,
    basePrice: 2500000,
    status: "available",
  },
  {
    inventoryNumber: "P-102",
    title: "Plot 102",
    inventoryType: "plot",
    category: "Residential",
    area: 150,
    basePrice: 3100000,
    status: "available",
  },
  {
    inventoryNumber: "P-103",
    title: "Plot 103",
    inventoryType: "plot",
    category: "Residential",
    area: 180,
    basePrice: 3600000,
    status: "hold",
  },
  {
    inventoryNumber: "S-201",
    title: "Shop 201",
    inventoryType: "shop",
    category: "Commercial",
    area: 450,
    basePrice: 5200000,
    status: "available",
  },
];

async function seedInventory() {
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

  const existingCount =
    await Inventory.countDocuments({
      projectId: project._id,
    });

  if (existingCount > 0) {
    console.log(
      `Inventory already exists for project (${existingCount} units). Skipping seed.`
    );
    await mongoose.disconnect();
    return;
  }

  const createdBy =
    project.createdBy || project._id;

  const docs = samplePlots.map(
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

  console.log(
    `Seeded ${docs.length} inventory units for project "${project.name}".`
  );

  await mongoose.disconnect();
}

seedInventory().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
