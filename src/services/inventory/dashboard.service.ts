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

function mapInventoryItem(item: IInventory) {
  const inventoryNumber =
    item.inventoryNumber || "";

  const isPlot =
    item.inventoryType === "plot";

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
