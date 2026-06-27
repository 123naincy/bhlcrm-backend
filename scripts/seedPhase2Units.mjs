import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const BUILDINGS = [
  "Building One",
  "Building Two",
];

const BUILDING_KEYS = {
  "Building One": "B1",
  "Building Two": "B2",
};

const FLOORS = [
  {
    name: "Ground Floor",
    key: "GF",
    bhk: 4,
    blk: 12,
  },
  {
    name: "First Floor",
    key: "1F",
    bhk: 4,
    blk: 13,
  },
  {
    name: "Second Floor",
    key: "2F",
    bhk: 4,
    blk: 13,
  },
  {
    name: "Third Floor",
    key: "3F",
    bhk: 4,
    blk: 13,
  },
];

const AREAS = {
  "1 BHK": 650,
  "1 BLK": 550,
  "2 BHK": 950,
  Commercial: 400,
  "Single Bunglow": 1800,
  "Twin Bunglow": 2800,
};

const PRICES_PER_UNIT = {
  "1 BHK": 3500000,
  "1 BLK": 2800000,
  "2 BHK": 5200000,
  Commercial: 4500000,
  "Single Bunglow": 12000000,
  "Twin Bunglow": 18000000,
};

/** 13 C-type blocks, 5 × 2 BHK in each */
const C_TYPE_BLOCKS = 13;
const UNITS_PER_C_TYPE = 5;

/** Commercial shop count */
const COMMERCIAL_SHOPS = 9;

/** Bunglow — 1 Single + 1 Twin only */
const SINGLE_BUNGLOW_COUNT = 1;
const TWIN_BUNGLOW_COUNT = 1;

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

function buildBuildingUnits(buildingName) {
  const buildingKey =
    BUILDING_KEYS[buildingName];

  const units = [];

  for (const floor of FLOORS) {
    for (let i = 1; i <= floor.bhk; i += 1) {
      units.push({
        inventoryNumber: `${buildingKey}-${floor.key}-1BHK-${pad(i)}`,
        title: `${buildingName} ${floor.name} 1 BHK ${pad(i)}`,
        inventoryType: "apartment",
        category: "1 BHK",
        phase: 2,
        block: buildingName,
        floor: floor.name,
        area: AREAS["1 BHK"],
        areaUnit: "Sq.Ft",
        basePrice: PRICES_PER_UNIT["1 BHK"],
        status: "available",
      });
    }

    for (let i = 1; i <= floor.blk; i += 1) {
      units.push({
        inventoryNumber: `${buildingKey}-${floor.key}-BLK-${pad(i)}`,
        title: `${buildingName} ${floor.name} 1 BLK ${pad(i)}`,
        inventoryType: "apartment",
        category: "1 BLK",
        phase: 2,
        block: buildingName,
        floor: floor.name,
        area: AREAS["1 BLK"],
        areaUnit: "Sq.Ft",
        basePrice: PRICES_PER_UNIT["1 BLK"],
        status: "available",
      });
    }
  }

  return units;
}

function buildCTypeUnits() {
  /**
   * 13 C-type blocks · 5 units (2 BHK) each = 65 units
   */
  const units = [];

  for (
    let block = 1;
    block <= C_TYPE_BLOCKS;
    block += 1
  ) {
    const blockLabel = `C-${pad(block)}`;

    for (
      let unit = 1;
      unit <= UNITS_PER_C_TYPE;
      unit += 1
    ) {
      units.push({
        inventoryNumber: `${blockLabel}-${pad(unit)}`,
        title: `C Type ${blockLabel} Unit ${pad(unit)} (2 BHK)`,
        inventoryType: "apartment",
        category: "2 BHK",
        phase: 2,
        block: "C Type",
        tower: blockLabel,
        floor: "",
        area: AREAS["2 BHK"],
        areaUnit: "Sq.Ft",
        basePrice: PRICES_PER_UNIT["2 BHK"],
        status: "available",
      });
    }
  }

  return units;
}

function buildETypeUnits() {
  /**
   * E Type — 4 clusters × 8 units (2 BHK each)
   */
  const units = [];

  for (let cluster = 1; cluster <= 4; cluster += 1) {
    for (let unit = 1; unit <= 8; unit += 1) {
      units.push({
        inventoryNumber: `E${cluster}-${pad(unit)}`,
        title: `E Type E${cluster} Unit ${pad(unit)}`,
        inventoryType: "apartment",
        category: "2 BHK",
        phase: 2,
        block: "E Type",
        tower: `E${cluster}`,
        floor: "",
        area: AREAS["2 BHK"],
        areaUnit: "Sq.Ft",
        basePrice: PRICES_PER_UNIT["2 BHK"],
        status: "available",
      });
    }
  }

  return units;
}

function buildCommercialUnits() {
  const units = [];

  for (let i = 1; i <= COMMERCIAL_SHOPS; i += 1) {
    units.push({
      inventoryNumber: `COM-${pad(i)}`,
      title: `Commercial Shop ${pad(i)}`,
      inventoryType: "shop",
      category: "Commercial",
      phase: 2,
      block: "Commercial",
      floor: "",
      area: AREAS.Commercial,
      areaUnit: "Sq.Ft",
      basePrice: PRICES_PER_UNIT.Commercial,
      status: "available",
    });
  }

  return units;
}

function buildBunglowUnits() {
  const units = [];

  for (
    let i = 1;
    i <= SINGLE_BUNGLOW_COUNT;
    i += 1
  ) {
    units.push({
      inventoryNumber: `SB-${pad(i)}`,
      title: `Single Bunglow ${pad(i)}`,
      inventoryType: "apartment",
      category: "Single Bunglow",
      phase: 2,
      block: "Bunglow",
      tower: "Single Bunglow",
      floor: "",
      area: AREAS["Single Bunglow"],
      areaUnit: "Sq.Yd",
      basePrice:
        PRICES_PER_UNIT["Single Bunglow"],
      status: "available",
    });
  }

  for (
    let i = 1;
    i <= TWIN_BUNGLOW_COUNT;
    i += 1
  ) {
    units.push({
      inventoryNumber: `TB-${pad(i)}`,
      title: `Twin Bunglow ${pad(i)}`,
      inventoryType: "apartment",
      category: "Twin Bunglow",
      phase: 2,
      block: "Bunglow",
      tower: "Twin Bunglow",
      floor: "",
      area: AREAS["Twin Bunglow"],
      areaUnit: "Sq.Yd",
      basePrice:
        PRICES_PER_UNIT["Twin Bunglow"],
      status: "available",
    });
  }

  return units;
}

function buildPhase2Units() {
  const buildingUnits = BUILDINGS.flatMap(
    (building) =>
      buildBuildingUnits(building)
  );

  return [
    ...buildingUnits,
    ...buildCTypeUnits(),
    ...buildETypeUnits(),
    ...buildCommercialUnits(),
    ...buildBunglowUnits(),
  ];
}

async function seedPhase2Units() {
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

  const docs = buildPhase2Units();

  const existingPhase2 =
    await Inventory.countDocuments({
      phase: 2,
    });

  if (
    existingPhase2 >= docs.length &&
    !force
  ) {
    console.log(
      `Phase 2 already has ${existingPhase2} units. Use --force to reseed.`
    );
    await mongoose.disconnect();
    return;
  }

  if (force || existingPhase2 > 0) {
    await Inventory.deleteMany({
      phase: 2,
    });
  }

  const createdBy =
    project.createdBy || project._id;

  const records = docs.map((unit) => ({
    ...unit,
    projectId: project._id,
    phaseId: project._id,
    plcApplicable: false,
    plcAmount: 0,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await Inventory.insertMany(records);

  const summary = {
    "Building One": records.filter(
      (item) =>
        item.block === "Building One"
    ).length,
    "Building Two": records.filter(
      (item) =>
        item.block === "Building Two"
    ).length,
    "C Type": records.filter(
      (item) => item.block === "C Type"
    ).length,
    "C Type Blocks": C_TYPE_BLOCKS,
    "E Type": records.filter(
      (item) => item.block === "E Type"
    ).length,
    Commercial: records.filter(
      (item) =>
        item.block === "Commercial"
    ).length,
    "Single Bunglow": records.filter(
      (item) =>
        item.category === "Single Bunglow"
    ).length,
    "Twin Bunglow": records.filter(
      (item) =>
        item.category === "Twin Bunglow"
    ).length,
  };

  console.log(
    `Seeded ${records.length} Phase 2 units for project "${project.name}".`
  );
  console.log("Breakdown:", summary);

  await mongoose.disconnect();
}

seedPhase2Units().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
