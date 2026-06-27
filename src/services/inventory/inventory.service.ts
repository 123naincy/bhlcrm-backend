import Inventory from "../../models/inventory/Inventory";
import { Types } from "mongoose";

class InventoryService {
  async getById(id: string) {
    return await Inventory.findById(id);
  }

  async validateAvailable(id: string) {
    const inventory = await Inventory.findById(id);

    if (!inventory) {
      throw new Error("Inventory not found.");
    }

    if (inventory.status !== "available") {
      throw new Error(
        `Inventory is already ${inventory.status}.`
      );
    }

    return inventory;
  }

  async validateForBooking(id: string) {
    const inventory = await Inventory.findById(id);

    if (!inventory) {
      throw new Error("Inventory not found.");
    }

    if (inventory.status === "sold") {
      throw new Error(
        "Inventory is already sold."
      );
    }

    if (
      inventory.status !== "available" &&
      inventory.status !== "hold"
    ) {
      throw new Error(
        `Inventory cannot be booked. Current status: ${inventory.status}.`
      );
    }

    return inventory;
  }

  async markHold(
    inventoryId: Types.ObjectId,
    holdId: Types.ObjectId
  ) {
    return await Inventory.findByIdAndUpdate(
      inventoryId,
      {
        status: "hold",
        holdId,
      },
      {
        new: true,
      }
    );
  }

  async releaseHold(
    inventoryId: Types.ObjectId
  ) {
    return await Inventory.findByIdAndUpdate(
      inventoryId,
      {
        status: "available",
        holdId: null,
      },
      {
        new: true,
      }
    );
  }
/**
 * Inventory Dashboard
 */
async getInventory(query: any = {}) {

    const filter: any = {};

    if (query.phase)
        filter.phase = query.phase;

    if (query.status)
        filter.status = query.status;

    if (query.type)
        filter.type = query.type;

    return Inventory.find(filter)
        .populate("bookingId")
        .sort({
            phase: 1,
            inventoryNo: 1
        });

}

/**
 * Inventory Details
 */
async getInventoryById(id: string) {

    return Inventory.findById(id)
        .populate("bookingId")
        .populate("holdId");

}

/**
 * Create Inventory
 */
async createInventory(
    data: any,
    userId: string
) {

    return Inventory.create({
      ...data,
      createdBy: new Types.ObjectId(userId)
    });

}

/**
 * Update Inventory
 */
async updateInventory(
    id: string,
    data: any
) {

    return Inventory.findByIdAndUpdate(
        id,
        data,
        {
            new: true
        }
    );

}

/**
 * Change Inventory Status
 */
async changeStatus(
    id: string,
    status: string
) {

    return Inventory.findByIdAndUpdate(
        id,
        {
            status
        },
        {
            new: true
        }
    );

}

/**
 * Delete Inventory
 */
async deleteInventory(id: string) {

    return Inventory.findByIdAndDelete(id);

}
  async markSold(
    inventoryId: Types.ObjectId,
    bookingId: Types.ObjectId
  ) {
    return await Inventory.findByIdAndUpdate(
      inventoryId,
      {
        status: "sold",
        bookingId,
        holdId: null,
      },
      {
        new: true,
      }
    );
  }
}

export default new InventoryService();