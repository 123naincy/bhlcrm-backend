import { Request, Response } from "express";
import crypto from "crypto";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import CallLog from "../../models/activity/CallLog";
import { logLeadActivity } from "../../utils/logLeadActivity";

interface AuthRequest extends Request {
  user?: any;
}

const allowedMimeTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/amr",
  "audio/3gpp",
  "audio/3gpp2",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
];

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey:
      process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const uploadRecording = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    console.log(
      "========== RECORDING UPLOAD =========="
    );

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Recording file is required.",
      });
    }

    if (
      !allowedMimeTypes.includes(
        req.file.mimetype
      )
    ) {
      return res.status(400).json({
        success: false,
        message: `Unsupported audio format: ${req.file.mimetype}`,
      });
    }

    const {
      leadId,
      phone,
      callType,
      callStatus,
      duration,
      callDate,
    } = req.body;

    if (!leadId || !phone) {
      return res.status(400).json({
        success: false,
        message:
          "leadId and phone are required.",
      });
    }

    /**
     * Prevent duplicate uploads
     */
    const existing = await CallLog.findOne({
  phone,
  duration: Number(duration),
  callType,
  agentId: req.user.userId,
}).sort({ createdAt: -1 });

if (
  existing &&
  Math.abs(
    new Date(existing.callDate).getTime() -
    new Date(callDate).getTime()
  ) < 60000 // 1 minute
) {
  return res.status(200).json({
    success: true,
    message: "Recording already uploaded.",
    data: existing,
  });
}
    if (existing) {
      return res.status(200).json({
        success: true,
        message:
          "Recording already uploaded.",
        data: existing,
      });
    }

    /**
     * Generate S3 filename
     */
    const extension =
      req.file.originalname.includes(".")
        ? req.file.originalname
            .split(".")
            .pop()
        : "m4a";

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const key = `recordings/${fileName}`;

    console.log("Uploading:", key);

    /**
     * Upload to S3
     */
    await s3.send(
      new PutObjectCommand({
        Bucket:
          process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType:
          req.file.mimetype,

        Metadata: {
          uploadedBy:
            String(req.user.userId),
          leadId: String(leadId),
          phone,
          uploadedAt:
            new Date().toISOString(),
        },
      })
    );

    const recordingUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    console.log(
      "Recording uploaded:",
      recordingUrl
    );
    /**
     * Create Call Log
     */
    const callLog = await CallLog.create({
      leadId,
      agentId: req.user.userId,

      phone,

      callType:
        callType || "OUTGOING",

      callStatus:
        callStatus ||
        (Number(duration) > 0
          ? "ANSWERED"
          : "NOT_ANSWERED"),

      duration: Number(duration) || 0,

      recordingUrl,

      summary: "",

      // AI summary not enabled currently
      summaryStatus: "FAILED",

      callDate: callDate
        ? new Date(callDate)
        : new Date(),
    });

    /**
     * Add activity to Lead Timeline
     */
    try {
      await logLeadActivity({
        leadId: leadId.toString(),
        actionType: "call_recording",
        newValue: recordingUrl,
        note: "Call recording uploaded",
        performedBy: req.user.userId,
      });
    } catch (activityError) {
      console.error(
        "Lead activity error:",
        activityError
      );
    }

    console.log(
      "CALL LOG CREATED:",
      callLog._id
    );

    return res.status(201).json({
      success: true,
      message:
        "Recording uploaded successfully.",
      data: {
        callLog,
      },
    });

  } catch (error: any) {

    console.error(
      "UPLOAD ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Recording upload failed.",
    });
  }
};
 