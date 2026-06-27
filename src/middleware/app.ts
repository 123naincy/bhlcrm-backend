import express from "express";
import path from "path";

export default function registerUploads(app: express.Application) {
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "uploads"))
  );
}