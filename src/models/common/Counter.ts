import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface ICounter
  extends Document {
  module: string;

  prefix: string;

  sequence: number;

  padding: number;
}

const CounterSchema = new Schema(
  {
    module: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    prefix: {
      type: String,
      required: true,
      trim: true,
    },

    sequence: {
      type: Number,
      default: 0,
    },

    padding: {
      type: Number,
      default: 6,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICounter>(
  "Counter",
  CounterSchema
);