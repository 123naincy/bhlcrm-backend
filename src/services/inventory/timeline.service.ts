import { ClientSession } from "mongoose";

import Timeline, {
  ITimeline,
  TimelineEntity,
} from "../../models/inventory/Timeline";

class TimelineService {
  /**
   * Create Timeline Entry
   */
  async createTimeline(
    data: Partial<ITimeline>,
    session?: ClientSession
  ) {
    const timeline = await Timeline.create(
      [
        {
          ...data,
        },
      ],
      session ? { session } : {}
    );

    return timeline[0];
  }

  /**
   * Get Inventory Timeline
   */
  async getInventoryTimeline(
    inventoryId: string
  ) {
    return Timeline.find({
      inventoryId,
    })
      .populate(
        "createdBy",
        "fullName email"
      )
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Get Booking Timeline
   */
  async getBookingTimeline(
    bookingId: string
  ) {
    return Timeline.find({
      bookingId,
    })
      .populate(
        "createdBy",
        "fullName email"
      )
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Get Timeline By Entity
   */
  async getTimelineByEntity(
    entityType: TimelineEntity,
    entityId: string
  ) {
    return Timeline.find({
      entityType,
      entityId,
    })
      .populate(
        "createdBy",
        "fullName email"
      )
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Delete Timeline
   */
  async deleteTimeline(id: string) {
    return Timeline.findByIdAndDelete(
      id
    );
  }
}

export default new TimelineService();