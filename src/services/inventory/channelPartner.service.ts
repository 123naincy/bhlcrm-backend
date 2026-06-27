import ChannelPartner, {
  IChannelPartner,
} from "../../models/inventory/ChannelPartner";

class ChannelPartnerService {
  /**
   * Create Channel Partner
   */
  async createPartner(
    data: Partial<IChannelPartner>,
    session?: any
  ) {
    const partner =
      await ChannelPartner.create(
        [data],
        session ? { session } : {}
      );

    return partner[0];
  }

  /**
   * Update Channel Partner
   */
  async updatePartner(
    id: string,
    data: Partial<IChannelPartner>,
    session?: any
  ) {
    return await ChannelPartner.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        session,
      }
    );
  }

  /**
   * Get Partner By Id
   */
  async getPartnerById(id: string) {
    return await ChannelPartner.findById(id);
  }

  /**
   * Get All Partners
   */
  async getPartners(
    filter: any = {}
  ) {
    return await ChannelPartner.find(filter)
      .sort({
        companyName: 1,
      });
  }

  /**
   * Search Partner
   */
  async searchPartner(search: string) {
    return await ChannelPartner.find({
      $or: [
        {
          companyName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          contactPerson: {
            $regex: search,
            $options: "i",
          },
        },
        {
          mobile: {
            $regex: search,
            $options: "i",
          },
        },
        {
          partnerCode: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    }).limit(20);
  }

  /**
   * Find Duplicate Partner
   */
  async findDuplicate(
    mobile: string,
    email?: string
  ) {
    const conditions: any[] = [
      { mobile },
    ];

    if (email) {
      conditions.push({ email });
    }

    return await ChannelPartner.findOne({
      $or: conditions,
    });
  }

  /**
   * Generate Partner Code
   * Example : CP-000001
   */
  async generatePartnerCode() {
    const count =
      await ChannelPartner.countDocuments();

    return `CP-${String(
      count + 1
    ).padStart(6, "0")}`;
  }

  /**
   * Delete Partner
   */
  async deletePartner(id: string) {
    return await ChannelPartner.findByIdAndDelete(
      id
    );
  }
}

export default new ChannelPartnerService();