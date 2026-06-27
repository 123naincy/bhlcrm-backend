import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { connectDB } from "./config/db";
import sourceRoutes from "./routes/source/sourceRoutes";
import authRoutes from "./routes/auth/authRoutes";
import employeeRoutes from "./routes/employeeRoutes";
import leadRoutes from "./routes/lead/leadRoutes";
import dashboardRoutes from "./routes/dashboard/dashboardRoutes";
import userRoutes from "./routes/userRoutes";
import followUpRoutes from "./routes/followUpRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import projectRoutes from "./routes/project/projectRoutes";
import callLogRoutes from "./routes/callLogRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import inventoryRoutes from "./routes/inventory/index";
import errorHandler from "./utils/errorHandler";
const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/followups", followUpRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/call-logs", callLogRoutes);
app.use("/api/upload", uploadRoutes);
app.use(
  "/api/source-mappings",
  sourceRoutes
);
app.use("/api/inventory", inventoryRoutes);
app.get("/", (req, res) => {
  res.send("Real Estate CRM API Running");
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Not Found",
  });
});
app.use(errorHandler);
const PORT = process.env.PORT || 5000;

/* START */
app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});