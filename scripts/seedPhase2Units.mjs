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

/** Building upper floors — same layout on 1F/2F/3F (101–117, 201–217, 301–317) */
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

const BUILDING_FLOOR_LAYOUTS = {
  "Building One": {
    "Ground Floor": {
      floorKey: "GF",
      units: GROUND_FLOOR_LAYOUT,
    },
    "First Floor": {
      floorKey: "1F",
      units: BUILDING_UPPER_FLOOR_LAYOUT,
    },
    "Second Floor": {
      floorKey: "2F",
      units: BUILDING_UPPER_FLOOR_LAYOUT,
    },
    "Third Floor": {
      floorKey: "3F",
      units: BUILDING_UPPER_FLOOR_LAYOUT,
    },
  },
  "Building Two": {
    "Ground Floor": {
      floorKey: "GF",
      units: GROUND_FLOOR_LAYOUT,
    },
    "First Floor": {
      floorKey: "1F",
      units: BUILDING_UPPER_FLOOR_LAYOUT,
    },
    "Second Floor": {
      floorKey: "2F",
      units: BUILDING_UPPER_FLOOR_LAYOUT,
    },
    "Third Floor": {
      floorKey: "3F",
      units: BUILDING_UPPER_FLOOR_LAYOUT,
    },
  },
};

function getFloorLayoutEntry(
  buildingName,
  floorName,
  inventoryNumber
) {
  const layoutConfig =
    BUILDING_FLOOR_LAYOUTS[buildingName]?.[
      floorName
    ];

  if (
    !layoutConfig ||
    !BUILDING_KEYS[buildingName]
  ) {
    return null;
  }

  const buildingKey =
    BUILDING_KEYS[buildingName];

  return (
    layoutConfig.units.find(
      (unit) =>
        inventoryNumber ===
        `${buildingKey}-${layoutConfig.floorKey}-${unit.suffix}`
    ) || null
  );
}

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

/** C Type row — positions 1–5, saleable area in Sq.Ft (same for every block) */
const C_TYPE_ROW_LAYOUT = [
  { unit: 1, area: 1217 },
  { unit: 2, area: 1209 },
  { unit: 3, area: 1266 },
  { unit: 4, area: 1209 },
  { unit: 5, area: 1217 },
];

/** Commercial shop count per floor */
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

/** Bunglow — 1 Single + 1 Twin only */
const SINGLE_BUNGLOW_COUNT = 1;
const TWIN_BUNGLOW_COUNT = 1;

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

function resolveUnitArea(
  buildingName,
  floorName,
  inventoryNumber,
  category
) {
  const layoutEntry =
    getFloorLayoutEntry(
      buildingName,
      floorName,
      inventoryNumber
    );

  if (layoutEntry) {
    return layoutEntry.area;
  }

  return AREAS[category];
}

function buildBuildingUnits(buildingName) {
  const buildingKey =
    BUILDING_KEYS[buildingName];

  const units = [];

  for (const floor of FLOORS) {
    for (let i = 1; i <= floor.bhk; i += 1) {
      const inventoryNumber = `${buildingKey}-${floor.key}-1BHK-${pad(i)}`;

      units.push({
        inventoryNumber,
        title: `${buildingName} ${floor.name} 1 BHK ${pad(i)}`,
        inventoryType: "apartment",
        category: "1 BHK",
        phase: 2,
        block: buildingName,
        floor: floor.name,
        area: resolveUnitArea(
          buildingName,
          floor.name,
          inventoryNumber,
          "1 BHK"
        ),
        areaUnit: "Sq.Ft",
        basePrice: PRICES_PER_UNIT["1 BHK"],
        status: "available",
      });
    }

    for (let i = 1; i <= floor.blk; i += 1) {
      const inventoryNumber = `${buildingKey}-${floor.key}-BLK-${pad(i)}`;

      units.push({
        inventoryNumber,
        title: `${buildingName} ${floor.name} 1 BLK ${pad(i)}`,
        inventoryType: "apartment",
        category: "1 BLK",
        phase: 2,
        block: buildingName,
        floor: floor.name,
        area: resolveUnitArea(
          buildingName,
          floor.name,
          inventoryNumber,
          "1 BLK"
        ),
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
      const rowUnit =
        C_TYPE_ROW_LAYOUT[unit - 1];

      units.push({
        inventoryNumber: `${blockLabel}-${pad(unit)}`,
        title: `C Type ${blockLabel} Unit ${pad(unit)} (2 BHK)`,
        inventoryType: "apartment",
        category: "2 BHK",
        phase: 2,
        block: "C Type",
        tower: blockLabel,
        floor: "",
        area: rowUnit.area,
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

  const units = [];

  for (let cluster = 1; cluster <= 4; cluster += 1) {
    for (const rowUnit of E_TYPE_ROW_LAYOUT) {
      units.push({
        inventoryNumber: `E${cluster}-${pad(rowUnit.unit)}`,
        title: `E Type E${cluster} Unit ${pad(rowUnit.unit)}`,
        inventoryType: "apartment",
        category: "2 BHK",
        phase: 2,
        block: "E Type",
        tower: `E${cluster}`,
        floor: "",
        area: rowUnit.area,
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

  for (const floor of COMMERCIAL_FLOORS) {
    for (let i = 1; i <= COMMERCIAL_SHOPS; i += 1) {
      units.push({
        inventoryNumber: `COM-${floor.key}-${pad(i)}`,
        title: `${floor.name} Shop ${pad(i)}`,
        inventoryType: "shop",
        category: floor.category,
        phase: 2,
        block: "Commercial",
        floor: floor.name,
        area: floor.area,
        areaUnit: "Sq.Ft",
        basePrice: PRICES_PER_UNIT.Commercial,
        status: "available",
      });
    }
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
      areaUnit: "Sq.Ft",
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
      areaUnit: "Sq.Ft",
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
