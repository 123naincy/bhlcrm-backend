import { Router } from "express";

import inventoryRoutes from "./inventory.routes";
import bookingRoutes from "./booking.routes";
import holdRoutes from "./hold.routes";
import paymentRoutes from "./payment.routes";
import customerRoutes from "./customer.routes";
import channelPartnerRoutes from "./channelPartner.routes";
import dashboardRoutes from "./dashboard.routes";
const router = Router();

router.use("/dashboard", dashboardRoutes);

router.use("/bookings", bookingRoutes);

router.use("/holds", holdRoutes);

router.use("/payments", paymentRoutes);

router.use("/customers", customerRoutes);

router.use(
  "/channel-partners",
  channelPartnerRoutes
);

router.use("/", inventoryRoutes);

export default router;