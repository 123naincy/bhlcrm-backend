import Counter from "../../models/common/Counter";

class CounterService {
  /**
   * Generate Next Code
   */
  async getNextSequence(
    module: string
  ) {
    const counter =
      await Counter.findOneAndUpdate(
        {
          module,
        },
        {
          $inc: {
            sequence: 1,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

    const year =
      new Date().getFullYear();

    return `${counter.prefix}-${year}-${String(
      counter.sequence
    ).padStart(
      counter.padding,
      "0"
    )}`;
  }
}

export default new CounterService();