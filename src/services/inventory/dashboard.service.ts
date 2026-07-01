import Inventory, {
  IInventory,
} from "../../models/inventory/Inventory";
import Booking from "../../models/inventory/Booking";
import Payment from "../../models/inventory/Payment";
import { Types } from "mongoose";

function parsePlotNumber(
  inventoryNumber: string
) {
  return (
    Number.parseInt(
      inventoryNumber.replace(/\D/g, ""),
      10
    ) || 0
  );
}

function sortByPlotNumber(
  items: IInventory[]
) {
  return [...items].sort(
    (a, b) =>
      parsePlotNumber(
        a.inventoryNumber || ""
      ) -
      parsePlotNumber(
        b.inventoryNumber || ""
      )
  );
}

const BUILDING_KEYS: Record<
  string,
  string
> = {
  "Building One": "B1",
  "Building Two": "B2",
};

/** Phase 2 · Ground Floor — positions 1–16 in floor-plan order */
const GROUND_FLOOR_LAYOUT_SUFFIXES = [
  "BLK-01",
  "BLK-02",
  "BLK-03",
  "BLK-04",
  "1BHK-01",
  "1BHK-02",
  "BLK-05",
  "BLK-06",
  "BLK-07",
  "BLK-08",
  "BLK-09",
  "BLK-10",
  "BLK-11",
  "1BHK-03",
  "1BHK-04",
  "BLK-12",
];

/** Building upper floors — same layout on 1F/2F/3F */
const BUILDING_UPPER_FLOOR_SUFFIXES = [
  "BLK-01",
  "BLK-02",
  "BLK-03",
  "BLK-04",
  "1BHK-01",
  "1BHK-02",
  "BLK-05",
  "BLK-06",
  "BLK-07",
  "BLK-08",
  "BLK-09",
  "BLK-10",
  "BLK-11",
  "BLK-12",
  "1BHK-03",
  "1BHK-04",
  "BLK-13",
];

type BuildingFloorLayout = {
  block: string;
  floor: string;
  floorKey: string;
  positionStart: number;
  suffixes: string[];
};

const BUILDING_FLOOR_LAYOUTS: BuildingFloorLayout[] =
  [
    {
      block: "Building One",
      floor: "Ground Floor",
      floorKey: "GF",
      positionStart: 1,
      suffixes:
        GROUND_FLOOR_LAYOUT_SUFFIXES,
    },
    {
      block: "Building Two",
      floor: "Ground Floor",
      floorKey: "GF",
      positionStart: 1,
      suffixes:
        GROUND_FLOOR_LAYOUT_SUFFIXES,
    },
    {
      block: "Building One",
      floor: "First Floor",
      floorKey: "1F",
      positionStart: 101,
      suffixes:
        BUILDING_UPPER_FLOOR_SUFFIXES,
    },
    {
      block: "Building One",
      floor: "Second Floor",
      floorKey: "2F",
      positionStart: 201,
      suffixes:
        BUILDING_UPPER_FLOOR_SUFFIXES,
    },
    {
      block: "Building One",
      floor: "Third Floor",
      floorKey: "3F",
      positionStart: 301,
      suffixes:
        BUILDING_UPPER_FLOOR_SUFFIXES,
    },
    {
      block: "Building Two",
      floor: "First Floor",
      floorKey: "1F",
      positionStart: 101,
      suffixes:
        BUILDING_UPPER_FLOOR_SUFFIXES,
    },
    {
      block: "Building Two",
      floor: "Second Floor",
      floorKey: "2F",
      positionStart: 201,
      suffixes:
        BUILDING_UPPER_FLOOR_SUFFIXES,
    },
    {
      block: "Building Two",
      floor: "Third Floor",
      floorKey: "3F",
      positionStart: 301,
      suffixes:
        BUILDING_UPPER_FLOOR_SUFFIXES,
    },
  ];

function getBuildingFloorLayoutMatch(
  item: IInventory
) {
  const buildingKey =
    BUILDING_KEYS[item.block || ""];

  if (!buildingKey) {
    return null;
  }

  const inventoryNumber =
    item.inventoryNumber || "";

  for (const layout of BUILDING_FLOOR_LAYOUTS) {
    if (
      item.block !== layout.block ||
      item.floor !== layout.floor
    ) {
      continue;
    }

    for (
      let index = 0;
      index < layout.suffixes.length;
      index += 1
    ) {
      if (
        inventoryNumber ===
        `${buildingKey}-${layout.floorKey}-${layout.suffixes[index]}`
      ) {
        return {
          layoutIndex: index,
          floorPosition:
            layout.positionStart + index,
        };
      }
    }
  }

  return null;
}

const COMMERCIAL_SHOP_COUNT = 9;

function getCommercialLayoutMatch(
  item: IInventory
) {
  if (item.block !== "Commercial") {
    return null;
  }

  const inventoryNumber =
    item.inventoryNumber || "";

  const floorConfigs = [
    { floor: "Ground Floor", floorKey: "GF" },
    { floor: "First Floor", floorKey: "1F" },
  ];

  for (const config of floorConfigs) {
    for (
      let index = 0;
      index < COMMERCIAL_SHOP_COUNT;
      index += 1
    ) {
      const shopNo = String(
        index + 1
      ).padStart(2, "0");

      if (
        inventoryNumber ===
        `COM-${config.floorKey}-${shopNo}`
      ) {
        return {
          layoutIndex: index,
          floorPosition: index + 1,
        };
      }
    }
  }

  const legacyMatch =
    inventoryNumber.match(
      /^COM-(\d{2})$/
    );

  if (legacyMatch) {
    const index =
      Number.parseInt(
        legacyMatch[1],
        10
      ) - 1;

    return {
      layoutIndex: index,
      floorPosition: index + 1,
    };
  }

  return null;
}

function getInventoryLayoutMatch(
  item: IInventory
) {
  return (
    getBuildingFloorLayoutMatch(item) ??
    getCommercialLayoutMatch(item)
  );
}

function mapInventoryItem(item: IInventory) {
  const inventoryNumber =
    item.inventoryNumber || "";

  const isPlot =
    item.inventoryType === "plot";

  const layoutMatch =
    getInventoryLayoutMatch(item);

  const floorPosition =
    layoutMatch?.floorPosition;

  return {
    _id: item._id,
    inventoryNo: parsePlotNumber(
      inventoryNumber
    ),
    plotNo:
      inventoryNumber || item.title,
    title: item.title || inventoryNumber,
    phase: item.phase ?? 1,
    block: item.block || "",
    tower: item.tower || "",
    floor: item.floor || "",
    floorPosition,
    category: item.category || "",
    area: item.area,
    areaUnit: item.areaUnit || "Sq.Yd",
    type: item.inventoryType,
    status: item.status,
    bookingId: item.bookingId
      ? String(item.bookingId)
      : undefined,
    holdId: item.holdId
      ? String(item.holdId)
      : undefined,
    isPlot,
  };
}

const PHASE2_BLOCK_ORDER = [
  "Building One",
  "Building Two",
  "C Type",
  "E Type",
  "Commercial",
  "Bunglow",
];

const PHASE2_FLOOR_ORDER = [
  "Ground Floor",
  "First Floor",
  "Second Floor",
  "Third Floor",
];

function getPhase2LayoutIndex(
  item: IInventory
) {
  return (
    getInventoryLayoutMatch(item)
      ?.layoutIndex ?? null
  );
}

function sortPhase2Units(
  items: IInventory[]
) {
  return [...items].sort((a, b) => {
    const blockA =
      a.block || "";
    const blockB =
      b.block || "";

    const blockIndexA =
      PHASE2_BLOCK_ORDER.indexOf(
        blockA
      );
    const blockIndexB =
      PHASE2_BLOCK_ORDER.indexOf(
        blockB
      );

    if (
      blockIndexA !== blockIndexB
    ) {
      return (
        (blockIndexA === -1
          ? 99
          : blockIndexA) -
        (blockIndexB === -1
          ? 99
          : blockIndexB)
      );
    }

    const floorA = a.floor || "";
    const floorB = b.floor || "";

    const floorIndexA =
      PHASE2_FLOOR_ORDER.indexOf(
        floorA
      );
    const floorIndexB =
      PHASE2_FLOOR_ORDER.indexOf(
        floorB
      );

    if (
      floorIndexA !== floorIndexB
    ) {
      return (
        (floorIndexA === -1
          ? 99
          : floorIndexA) -
        (floorIndexB === -1
          ? 99
          : floorIndexB)
      );
    }

    const towerA = a.tower || "";
    const towerB = b.tower || "";

    if (towerA !== towerB) {
      return towerA.localeCompare(
        towerB,
        undefined,
        { numeric: true }
      );
    }

    const layoutIndexA =
      getPhase2LayoutIndex(a);
    const layoutIndexB =
      getPhase2LayoutIndex(b);

    if (
      layoutIndexA !== null &&
      layoutIndexB !== null
    ) {
      return layoutIndexA - layoutIndexB;
    }

    return (
      a.inventoryNumber || ""
    ).localeCompare(
      b.inventoryNumber || "",
      undefined,
      { numeric: true }
    );
  });
}

function buildStatusSummary(
  items: IInventory[]
) {
  return {
    totalUnits: items.length,

    available: items.filter(
      (item) =>
        item.status === "available"
    ).length,

    hold: items.filter(
      (item) => item.status === "hold"
    ).length,

    sold: items.filter(
      (item) => item.status === "sold"
    ).length,

    totalArea: items.reduce(
      (sum, item) =>
        sum + (item.area || 0),
      0
    ),
  };
}

async function getFinancialSummary(
  inventoryIds: Types.ObjectId[]
) {
  if (!inventoryIds.length) {
    return {
      totalSales: 0,
      totalReceived: 0,
      totalPending: 0,
    };
  }

  const bookings =
    await Booking.find({
      inventoryId: {
        $in: inventoryIds,
      },
    }).select(
      "_id totalSaleValue"
    );

  const totalSales =
    bookings.reduce(
      (sum, booking) =>
        sum +
        (booking.totalSaleValue || 0),
      0
    );

  const bookingIds =
    bookings.map(
      (booking) => booking._id
    );

  const paymentTotals =
    bookingIds.length
      ? await Payment.aggregate([
          {
            $match: {
              bookingId: {
                $in: bookingIds,
              },
            },
          },
          {
            $group: {
              _id: null,

              totalReceived: {
                $sum: "$amount",
              },
            },
          },
        ])
      : [];

  const totalReceived =
    paymentTotals[0]
      ?.totalReceived || 0;

  return {
    totalSales,

    totalReceived,

    totalPending: Math.max(
      totalSales - totalReceived,
      0
    ),
  };
}

async function buildPhaseSummary(
  items: IInventory[]
) {
  const statusSummary =
    buildStatusSummary(items);

  const financials =
    await getFinancialSummary(
      items.map(
        (item) => item._id
      )
    );

  return {
    ...statusSummary,
    ...financials,
  };
}

class DashboardService {
  /**
   * Inventory Dashboard
   */
  async getDashboard() {
    const [phase1Raw, phase2Raw] =
      await Promise.all([
        Inventory.find({
          phase: 1,
          inventoryType: "plot",
        }),

        Inventory.find({
          phase: 2,
        }),
      ]);

    const phase1Items =
      sortByPlotNumber(phase1Raw);

    const phase2Items =
      sortPhase2Units(phase2Raw);

    const [
      phase1Summary,
      phase2Summary,
    ] = await Promise.all([
      buildPhaseSummary(phase1Items),

      buildPhaseSummary(phase2Items),
    ]);

    const allItems = [
      ...phase1Items,
      ...phase2Items,
    ];

    const summary =
      await buildPhaseSummary(
        allItems
      );

    return {
      summary,

      phase1Summary,

      phase2Summary,

      phase1: phase1Items.map(
        mapInventoryItem
      ),

      phase2: phase2Items.map(
        mapInventoryItem
      ),
    };
  }

  /**
   * Inventory Status Summary
   */
  async getSummary() {
    return Inventory.aggregate([
      {
        $group: {
          _id: "$status",

          total: {
            $sum: 1,
          },
        },
      },
    ]);
  }
}

export default new DashboardService();
