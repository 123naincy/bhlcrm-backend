import express from "express";
import multer from "multer";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
});

router.post(
  "/recording",
  upload.single("recording"),
  async (req, res) => {
    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Recording file required",
        });
      }

      console.log(
        "REGION =",
        process.env.AWS_REGION
      );

      console.log(
        "BUCKET =",
        process.env.AWS_BUCKET_NAME
      );

      console.log(
        "ACCESS KEY =",
        process.env.AWS_ACCESS_KEY_ID
      );

      console.log(
        "SECRET EXISTS =",
        !!process.env.AWS_SECRET_ACCESS_KEY
      );

      console.log(
        "FILE =",
        req.file.originalname
      );

      console.log(
        "SIZE =",
        req.file.size
      );

      const s3 = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId:
            process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey:
            process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });

      const fileName =
        `${Date.now()}-${req.file.originalname}`;

      await s3.send(
        new PutObjectCommand({
          Bucket:
            process.env.AWS_BUCKET_NAME,
          Key:
            `recordings/${fileName}`,
          Body:
            req.file.buffer,
          ContentType:
            req.file.mimetype,
        })
      );

      const url =
        `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/recordings/${fileName}`;

      return res.status(200).json({
        success: true,
        url,
      });

    } catch (error: any) {

      console.error(
        "UPLOAD ERROR:",
        JSON.stringify(error, null, 2)
      );

      return res.status(500).json({
        success: false,
        message:
          error?.message || "Upload failed",
      });
    }
  }
);

export default router;