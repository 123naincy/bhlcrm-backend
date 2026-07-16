import { Request, Response } from "express";
import CallLog from "../../models/activity/CallLog";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  guessRecordingContentType,
  isPlayableHttpUrl,
  isPresignedS3Url,
  parseS3RecordingLocation,
} from "../../utils/parseS3RecordingLocation";

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

async function getCallLogRecording(
  callLogId: string
) {
  const callLog = await CallLog.findById(callLogId);

  if (!callLog) {
    return {
      error: {
        status: 404,
        message: "Recording not found",
      },
    };
  }

  const recordingUrl = callLog.recordingUrl?.trim();

  if (!recordingUrl) {
    return {
      error: {
        status: 404,
        message: "No recording URL for this call log",
      },
    };
  }

  return { callLog, recordingUrl };
}

async function buildPlaybackUrl(
  recordingUrl: string
) {
  if (isPresignedS3Url(recordingUrl)) {
    return recordingUrl;
  }

  const location =
    parseS3RecordingLocation(recordingUrl);

  if (!location) {
    if (isPlayableHttpUrl(recordingUrl)) {
      return recordingUrl;
    }

    return null;
  }

  const command = new GetObjectCommand({
    Bucket: location.bucket,
    Key: location.key,
    ResponseContentDisposition: "inline",
    ResponseContentType: guessRecordingContentType(
      location.key
    ),
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });
}

export const streamRecording = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getCallLogRecording(
      String(req.params.callLogId)
    );

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const recordingUrl = result.recordingUrl!;
    const location =
      parseS3RecordingLocation(recordingUrl);

    if (!location) {
      if (isPlayableHttpUrl(recordingUrl)) {
        return res.redirect(recordingUrl);
      }

      return res.status(400).json({
        success: false,
        message: "Recording is not stored in S3",
      });
    }

    const object = await s3Client.send(
      new GetObjectCommand({
        Bucket: location.bucket,
        Key: location.key,
      })
    );

    if (!object.Body) {
      return res.status(404).json({
        success: false,
        message: "Recording file missing in storage",
      });
    }

    res.setHeader(
      "Content-Type",
      object.ContentType ||
        guessRecordingContentType(location.key)
    );
    res.setHeader(
      "Content-Disposition",
      "inline"
    );

    if (object.ContentLength) {
      res.setHeader(
        "Content-Length",
        object.ContentLength
      );
    }

    const body = object.Body as NodeJS.ReadableStream;
    body.pipe(res);
  } catch (error) {
    console.error("streamRecording error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to stream recording",
      });
    }
  }
};

export const playRecording = async (
  req: Request,
  res: Response
) => {
  const wantsStream =
    req.query.stream === "1" ||
    req.query.stream === "true" ||
    req.query.mode === "stream";

  if (wantsStream) {
    return streamRecording(req, res);
  }

  try {
    const result = await getCallLogRecording(
      String(req.params.callLogId)
    );

    if (result.error) {
      return res.status(result.error.status).json({
        success: false,
        message: result.error.message,
      });
    }

    const playbackUrl = await buildPlaybackUrl(
      result.recordingUrl!
    );

    if (!playbackUrl) {
      return res.status(400).json({
        success: false,
        message: "Unable to resolve recording URL",
      });
    }

    return res.json({
      success: true,
      url: playbackUrl,
    });
  } catch (error) {
    console.error("playRecording error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate playback URL",
    });
  }
};
