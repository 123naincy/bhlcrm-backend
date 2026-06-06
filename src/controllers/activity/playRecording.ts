import { Request, Response } from "express";
import CallLog from "../../models/activity/CallLog";

import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:
          process.env.AWS_SECRET_ACCESS_KEY || "",
      }
    : undefined,
});

export const playRecording = async (
  req: Request,
  res: Response
) => {
  try {
    const callLog = await CallLog.findById(
      req.params.callLogId
    );

    if (!callLog) {
      return res.status(404).json({
        success: false,
        message: "Recording not found",
      });
    }
console.log("PLAY ROUTE LOADED");
    const recordingUrl = callLog.recordingUrl;

    if (!recordingUrl) {
      return res.status(404).json({
        success: false,
        message: "No recording URL for this call log",
      });
    }

    // If the stored URL is not an S3 URL, return it directly
    if (!recordingUrl.includes(".amazonaws.com/")) {
      return res.json({ success: true, url: recordingUrl });
    }

    const parts = recordingUrl.split(".amazonaws.com/");
    if (!parts[1]) {
      return res.status(400).json({
        success: false,
        message: "Invalid S3 recording URL",
      });
    }

    const key = parts[1];

    const bucket = process.env.AWS_BUCKET_NAME;
    if (!bucket) {
      console.error("AWS_BUCKET_NAME not configured");
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: missing S3 bucket",
      });
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    console.log("BUCKET:", bucket);
    console.log("KEY:", key);

    const signedUrl = await getSignedUrl(
      s3Client,
      command,
      { expiresIn: 3600 }
    );

    console.log("SIGNED URL:", signedUrl);
    return res.json({ success: true, url: signedUrl });
  } catch (error) {
    console.error("playRecording error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate URL",
    });
  }
};