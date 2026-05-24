import express from "express";
import {
  createLead,
  getLeads,
  reassignLead,
  updateLead,
  getLeadTimeline,
  filterLeads,
  getSingleLead,
  getKanbanLeads,
  exportLeads,
  importLeads,
  getAllLeads,
  getAssignedLeads,
  getMyLeads,
  bulkAssignLeads,
  getLeadById,
  updateLeadStatus,
  addLeadNote,
  capturePublicLead,
  metaWebhookVerify,
  metaWebhookReceive,
} from "../../controllers/lead/leadController";
import { authorizeRoles } from "../../middleware/auth/roleMiddleware";
import { protect } from "../../middleware/auth/authMiddleware";
import { upload } from "../../middleware/uploadMiddleware";

const router = express.Router();

// Static paths first — /:id must not catch "assigned", "kanban", etc.
router.post("/create", protect, createLead);
router.get(
  "/all",
  protect,
  authorizeRoles("super_admin", "admin", "sales_manager"),
  getAllLeads
);
router.get(
  "/assigned",
  protect,
  authorizeRoles("super_admin", "admin", "sales_manager"),
  getAssignedLeads
);
router.get(
  "/my",
  protect,
  authorizeRoles("sales_executive", "telecaller"),
  getMyLeads
);
router.get("/filter", protect, filterLeads);
router.get("/single/:id", protect, getSingleLead);
router.get("/export", protect, exportLeads);
router.get("/kanban", protect, getKanbanLeads);
router.get("/timeline/:leadId", protect, getLeadTimeline);
router.put(
  "/reassign/:leadId",
  protect,
  authorizeRoles("super_admin", "admin", "sales_manager"),
  reassignLead
);
router.post("/capture", capturePublicLead);
router.put("/update/:leadId", protect, updateLead);
router.post("/import", protect, upload.single("file"), importLeads);
router.get("/meta-webhook", metaWebhookVerify);
router.post("/meta-webhook", metaWebhookReceive);
router.put(
  "/bulk-assign",
  protect,
  authorizeRoles("super_admin", "admin", "sales_manager"),
  bulkAssignLeads
);
router.put("/:id/status", protect, updateLeadStatus);
router.put("/:id/note", protect, addLeadNote);
router.get("/:id", protect, getLeadById);
router.get("/", protect, getLeads);

export default router;
