import mongoose, {
  Schema,
  Document,
} from "mongoose";

export interface INotification
  extends Document {
  title: string;
  message: string;
  type: string;
  userId: mongoose.Types.ObjectId;
  isRead: boolean;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema =
  new Schema<INotification>(
    {
      title: {
        type: String,
        required: true,
      },

      message: {
        type: String,
        required: true,
      },

      type: {
        type: String,
        required: true,
      },

      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      isRead: {
        type: Boolean,
        default: false,
      },

      meta: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);