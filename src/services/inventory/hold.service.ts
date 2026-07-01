import mongoose from "mongoose";

import Hold, {
  IHold,
} from "../../models/inventory/Hold";

import inventoryService from "./inventory.service";
import timelineService from "./timeline.service";

class HoldService {
  /**
   * Create Hold
   */
  async createHold(
    data: Partial<IHold>,
    userId: string
  ) {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      // Validate Inventory
      const inventory =
        await inventoryService.validateAvailable(
          data.inventoryId!.toString()
        );

      // Create Hold
      const hold = await Hold.create(
        [
          {
            ...data,
            createdBy: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      // Update Inventory
      await inventoryService.markHold(
        inventory._id,
        hold[0]._id
      );

      // Timeline
      await timelineService.createTimeline(
        {
          entityType: "hold",
          entityId: hold[0]._id,

          inventoryId: inventory._id,

          title: "Inventory Hold",

          description: `${data.customerName} placed this inventory on hold.`,

          action: "hold_created",

          createdBy: new mongoose.Types.ObjectId(userId),
        },
        session
      );

      await session.commitTransaction();

      return hold[0];
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Release Hold
   */
  async releaseHold(
    holdId: string,
    userId: string
  ) {
    const session =
      await mongoose.startSession();

    session.startTransaction();

    try {
      const hold =
        await Hold.findById(holdId);

      if (!hold) {
        throw new Error(
          "Hold record not found."
        );
      }

      await inventoryService.releaseHold(
        hold.inventoryId
      );

      await hold.deleteOne({ session });

      await timelineService.createTimeline(
        {
          entityType: "hold",

          entityId: hold._id,

          inventoryId:
            hold.inventoryId,

          title: "Hold Released",

          description:
            "Inventory released from hold.",

          action: "hold_released",

          createdBy: new mongoose.Types.ObjectId(userId),
        },
        session
      );

      await session.commitTransaction();

      return true;
    } catch (error) {
      await session.abortTransaction();

      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get Hold Details
   */
  async getHold(id: string) {
    return Hold.findById(id);
  }

  /**
   * Get Active Holds
   */
  async getAllHolds() {
    return Hold.find()
      .populate("inventoryId")
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Extend Hold
   */
  async extendHold(
    holdId: string,
    expiryDate: string | Date,
    userId: string
  ) {
    const hold = await Hold.findById(holdId);

    if (!hold) {
      throw new Error(
        "Hold record not found."
      );
    }

    hold.expiryDate = new Date(expiryDate);
    await hold.save();

    await timelineService.createTimeline({
      entityType: "hold",
      entityId: hold._id,
      inventoryId: hold.inventoryId,
      title: "Hold Extended",
      description: "Hold expiry date extended.",
      action: "hold_extended",
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return hold;
  }
}

export default new HoldService();