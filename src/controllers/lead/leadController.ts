import { Request, Response } from "express";
import Lead from "../../models/lead/Lead";
import User from "../../models/auth/User";
import { logLeadActivity } from "../../utils/logLeadActivity";
import LeadActivity from "../../models/activity/LeadActivity";
import Notification from "../../models/Notification";
import FollowUp from "../../models/followup/FollowUp";
import CallLog from "../../models/activity/CallLog";
import { createNotification } from "../../utils/notificationHelper";
import ExcelJS from "exceljs";
import XLSX from "xlsx";
import axios from "axios";
import { detectProjectFromSource } from "../../utils/detectProjectFromSource";
import { extractProjectName } from "../../utils/leadProjectUtils";
import {
  getScheduledDate,
  requiresScheduleDate,
} from "../../utils/leadScheduleUtils";

const populateLeadQuery = (query: any) =>
  query
    .populate("assignedTo", "fullName email role")
    .populate("assignedBy", "fullName role")
    .populate("projectId", "name");

const serializeLead = (lead: any) => {
  if (!lead) return lead;

  const doc = lead.toObject ? lead.toObject() : lead;

  return {
    ...doc,
    projectName: extractProjectName(doc),
    scheduledDate: getScheduledDate(doc),
  };
};

const serializeLeads = (leads: any[]) =>
  leads.map(serializeLead);

/**
 * CREATE LEAD
 */
export const createLead = async (
  req: any,
  res: any
) => {
  try {
    const user = req.user;

    const allowedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    if (
      !allowedRoles.includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied",
      });
    }

    const {
      fullName,
      phone,
      email,
      source,
      city,
      sourceType,
      identifier,
      projectId,
      projectName,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !source ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields missing",
      });
    }

    const brandId =
      user?.brandId ||
      user?.userId;

    let detectedProject =
      null;

    if (
      sourceType &&
      identifier
    ) {
      detectedProject =
        await detectProjectFromSource(
          sourceType,
          identifier,
          brandId
        );
    }

    const lead =
      await Lead.create({
        fullName,
        phone,
        email,
        source,
        city,

        projectId:
          detectedProject?.projectId ||
          projectId,

        projectName:
          detectedProject?.projectName ||
          projectName ||
          "",

        status: "new",
        temperature:
          "cold",
        brandId,
      });

    await LeadActivity.create({
      leadId:
        lead._id.toString(),
      actionType:
        "lead_created",
      oldValue: "",
      newValue: "",
      note:
        detectedProject
          ? `Lead auto mapped to ${detectedProject.projectName}`
          : "Lead created manually",
      performedBy:
        user.userId,
    });

    res.status(201).json({
      success: true,
      message:
        "Lead created successfully",
      lead,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Lead creation failed",
    });
  }
};

/**
 * GET LEADS
 */
export const getLeads = async (
  req: any,
  res: Response
) => {
  try {
    const user = req.user;

    const {
      search,
      status,
      temperature,
      assignedTo,
      dateRange,
      fromDate,
      toDate,
    } = req.query;

    const filter: any = {};

    // Role based restriction
    if (
      user.role !== "super_admin" &&
      user.role !== "admin" &&
      user.role !== "sales_manager"
    ) {
      filter.assignedTo =
        user.userId;
    }

    // Search
    if (search) {
      filter.$or = [
        {
          fullName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Status
    if (status) {
      filter.status = status;
    }

    // Temperature
    if (temperature) {
      filter.temperature =
        temperature;
    }

    // Team Member Filter
    if (
      assignedTo &&
      (
        user.role ===
          "super_admin" ||
        user.role ===
          "admin" ||
        user.role ===
          "sales_manager"
      )
    ) {
      filter.assignedTo =
        assignedTo;
    }

    // Date Filter
    const today =
      new Date();

    if (
      dateRange === "today"
    ) {
      const start =
        new Date(today);

      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date(today);

      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.updatedAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (
      dateRange ===
      "yesterday"
    ) {
      const start =
        new Date(today);

      start.setDate(
        start.getDate() - 1
      );
      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date(today);

      end.setDate(
        end.getDate() - 1
      );
      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.updatedAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (
      dateRange ===
      "last7days"
    ) {
      const start =
        new Date(today);

      start.setDate(
        start.getDate() - 6
      );
      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date(today);

      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.updatedAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (
      dateRange ===
      "last30days"
    ) {
      const start =
        new Date(today);

      start.setDate(
        start.getDate() - 29
      );
      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date(today);

      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.updatedAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (
      dateRange ===
      "thisMonth"
    ) {
      const start =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );

      const end =
        new Date(today);

      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.updatedAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (
      dateRange ===
      "lastMonth"
    ) {
      const start =
        new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );

      const end =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );

      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.updatedAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (
      dateRange ===
        "custom" &&
      fromDate &&
      toDate
    ) {
      const start =
        new Date(
          fromDate as string
        );

      const end =
        new Date(
          toDate as string
        );

      end.setHours(
        23,
        59,
        59,
        999
      );

      filter.updatedAt = {
        $gte: start,
        $lte: end,
      };
    }

    const leads =
      await populateLeadQuery(
        Lead.find(filter)
      ).sort({
          updatedAt: -1,
      });

    return res.status(200).json({
      count:
        leads.length,
      leads:
        serializeLeads(
          leads
        ),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Server error",
    });
  }
};

/**
 * REASSIGN LEAD
 */
export const reassignLead = async (
  req: any,
  res: Response
) => {
  try {
    const { leadId } = req.params;
    const { newEmployeeId } = req.body;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const employee = await User.findById(
      newEmployeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (
      employee.role !== "sales_executive" &&
      employee.role !== "telecaller"
    ) {
      return res.status(400).json({
        message:
          "Lead can only be assigned to sales staff",
      });
    }

    if (!employee.isActive) {
      return res.status(400).json({
        message: "Employee is inactive",
      });
    }

    // old owner
    const oldAssignedTo =
      lead.assignedTo?.toString() || "";

    // update lead
    lead.assignedTo = employee._id as any;
    lead.status = "assigned";
    lead.updatedAt = new Date();

    await lead.save();

    // activity
    await logLeadActivity({
      leadId: lead._id.toString(),
      actionType: "lead_reassigned",
      oldValue: oldAssignedTo,
      newValue:
        employee._id.toString(),
      note: `Lead reassigned to ${employee.fullName}`,
      performedBy: req.user.userId,
    });

    // notify new assignee
    await createNotification({
      title: "Lead Assigned",
      message: `${lead.fullName} has been assigned to you`,
      type: "lead_assigned",
      userId:
        employee._id.toString(),
      meta: {
        leadId: lead._id,
      },
    });

    // notify old assignee
    if (
      oldAssignedTo &&
      oldAssignedTo !==
        employee._id.toString()
    ) {
      await createNotification({
        title: "Lead Reassigned",
        message: `${lead.fullName} has been moved from your queue`,
        type: "lead_reassigned",
        userId: oldAssignedTo,
        meta: {
          leadId: lead._id,
        },
      });
    }

    res.status(200).json({
      message:
        "Lead reassigned successfully",
      assignedTo:
        employee.fullName,
      lead,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

/**
 * UPDATE LEAD
 */
export const updateLead = async (
  req: any,
  res: Response
) => {
  try {
    const { leadId } = req.params;
    const user = req.user;

    const {
      status,
      temperature,
      followUpDate,
      scheduledDate,
      notes,
    } = req.body;

    const lead = await Lead.findById(
      leadId
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const privilegedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    if (
      !privilegedRoles.includes(
        user.role
      )
    ) {
      if (
        lead.assignedTo?.toString() !==
        user.userId
      ) {
        return res.status(403).json({
          message:
            "You can only update your own assigned leads",
        });
      }
    }

    const oldStatus = lead.status;
    const oldTemperature =
      lead.temperature;
    const oldFollowUpDate =
      lead.followUpDate?.toISOString() ||
      "";
    const oldScheduledDate =
      getScheduledDate(lead);
    const oldNotes =
      lead.notes || "";

    const nextStatus =
      status !== undefined && status
        ? status
        : lead.status;

    if (
      requiresScheduleDate(nextStatus)
    ) {
      const nextScheduledDate =
        scheduledDate !== undefined
          ? scheduledDate
          : getScheduledDate(lead);

      if (!nextScheduledDate) {
        return res.status(400).json({
          message:
            "Schedule date required for this status",
        });
      }
    }

    let worked = false;

    // managers/admins to notify
    const managers =
      await User.find({
        role: {
          $in: [
            "super_admin",
            "admin",
            "sales_manager",
          ],
        },
        isActive: true,
      });

    // STATUS UPDATE
    if (status !== undefined && status) {
      worked = true;

      if (status !== oldStatus) {
        lead.status = status;

        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "status_updated",
          oldValue: oldStatus,
          newValue: status,
          performedBy:
            user.userId,
        });

        // notify managers
        for (const manager of managers) {
          await createNotification({
            title:
              status === "won"
                ? "Deal Won 🎉"
                : status === "lost"
                ? "Lead Lost ⚠"
                : "Lead Status Updated",
            message:
              status === "won"
                ? `${lead.fullName} converted successfully`
                : status ===
                  "lost"
                ? `${lead.fullName} marked as lost`
                : `${lead.fullName} moved to ${status}`,
            type:
              status === "won"
                ? "deal_won"
                : status === "lost"
                ? "deal_lost"
                : "lead_status_changed",
            userId:
              manager._id.toString(),
            meta: {
              leadId: lead._id,
            },
          });
        }
      } else {
        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "status_updated",
          oldValue: oldStatus,
          newValue: status,
          note: `Lead worked again. Status remained ${status}.`,
          performedBy:
            user.userId,
        });
      }
    }

    // TEMPERATURE
    if (
      temperature !== undefined &&
      temperature
    ) {
      worked = true;

      if (
        temperature !==
          oldTemperature
      ) {
        lead.temperature =
          temperature;

        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "temperature_updated",
          oldValue:
            oldTemperature,
          newValue:
            temperature,
          performedBy:
            user.userId,
        });
      } else {
        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "temperature_updated",
          oldValue:
            oldTemperature,
          newValue:
            temperature,
          note: `Lead worked again. Temperature remained ${temperature}.`,
          performedBy:
            user.userId,
        });
      }
    }

    // FOLLOW UP
    if (followUpDate !== undefined) {
      worked = true;

      const nextFollowUpDate = followUpDate
        ? new Date(followUpDate)
        : undefined;
      const nextFollowUpValue =
        followUpDate || "";

      if (
        nextFollowUpValue !==
        oldFollowUpDate
      ) {
        lead.followUpDate =
          nextFollowUpDate;

        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "followup_updated",
          oldValue:
            oldFollowUpDate,
          newValue:
            nextFollowUpValue,
          performedBy:
            user.userId,
        });
      } else {
        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "followup_updated",
          oldValue:
            oldFollowUpDate,
          newValue:
            nextFollowUpValue,
          note:
            "Lead worked again. Follow-up date unchanged.",
          performedBy:
            user.userId,
        });
      }
    }

    // SCHEDULE DATE (stored in existing extraFields)
    if (scheduledDate !== undefined) {
      worked = true;

      const nextScheduledValue =
        scheduledDate || "";

      if (
        nextScheduledValue !==
        oldScheduledDate
      ) {
        lead.extraFields = {
          ...(lead.extraFields || {}),
          scheduledDate:
            nextScheduledValue,
        };
        lead.markModified("extraFields");

        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "schedule_updated",
          oldValue:
            oldScheduledDate,
          newValue:
            nextScheduledValue,
          performedBy:
            user.userId,
        });
      } else {
        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "schedule_updated",
          oldValue:
            oldScheduledDate,
          newValue:
            nextScheduledValue,
          note:
            "Lead worked again. Schedule date unchanged.",
          performedBy:
            user.userId,
        });
      }
    }

    // NOTES
    if (notes !== undefined) {
      worked = true;

      if (notes !== oldNotes) {
        lead.notes = notes;

        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "notes_updated",
          oldValue: oldNotes,
          newValue: notes,
          performedBy:
            user.userId,
        });
      } else {
        await logLeadActivity({
          leadId:
            lead._id.toString(),
          actionType:
            "notes_updated",
          oldValue: oldNotes,
          newValue: notes,
          note:
            "Lead worked again. Notes unchanged.",
          performedBy:
            user.userId,
        });
      }
    }

    if (worked) {
      lead.updatedAt = new Date();
    }

    await lead.save();

    res.status(200).json({
      message:
        "Lead updated successfully",
      lead: serializeLead(lead),
    });
  } catch (error) {
    console.error("updateLead failed:", error);

    res.status(500).json({
      message: "Server error",
      error:
        error instanceof Error
          ? error.message
          : error,
    });
  }
};

/**
 * GET LEAD TIMELINE
 */
export const getLeadTimeline = async (req: any, res: Response) => {
  try {
    const { leadId } = req.params;
    const user = req.user;

    // Find lead
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Privileged roles
    const privilegedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    // Ownership check
    if (!privilegedRoles.includes(user.role)) {
      if (lead.assignedTo?.toString() !== user.userId) {
        return res.status(403).json({
          message: "You can only view your own lead timeline",
        });
      }
    }

    const LeadActivity = require("../../models/activity/LeadActivity").default;

    const timeline = await LeadActivity.find({
      leadId,
    })
      .populate("performedBy", "fullName email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: timeline.length,
      timeline,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

/**
 * FILTER + SEARCH LEADS
 */
export const filterLeads = async (
  req: any,
  res: Response
) => {
  try {
    const user = req.user;

    const {
      search,
      status,
      temperature,
      source,
      city,
      propertyType,
      employeeId,
      fromDate,
      toDate,
    } = req.query;

    const query: any = {};

    const privilegedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    // Role restriction
    if (
      !privilegedRoles.includes(user.role)
    ) {
      query.assignedTo = user.userId;
    }

    // Search
    if (search) {
      query.$or = [
        {
          fullName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // Existing filters
    if (status) query.status = status;
    if (temperature)
      query.temperature = temperature;
    if (source) query.source = source;
    if (city) query.city = city;
    if (propertyType)
      query.propertyType = propertyType;

    // Employee Filter
    if (
      employeeId &&
      privilegedRoles.includes(user.role)
    ) {
      query.assignedTo = employeeId;
    }

    // Date Filter
    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(
          new Date(toDate).setHours(
            23,
            59,
            59,
            999
          )
        ),
      };
    }

    const leads = await Lead.find(query)
      .populate(
        "assignedTo",
        "fullName email role"
      )
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error",
      error,
    });
  }
};
// getSingleLead

export const getSingleLead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const lead = await populateLeadQuery(
      Lead.findById(id)
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const privilegedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    if (
      !privilegedRoles.includes(user.role) &&
      lead.assignedTo?._id.toString() !== user.userId
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.status(200).json({
      lead: serializeLead(lead),
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};
export const getKanbanLeads = async (
  req: any,
  res: Response
) => {
  try {
    const user = req.user;

    const {
      status,
      page = 1,
      limit = 20,
      search = "",
      source = "",
      city = "",
      assignedTo = "",
    } = req.query;

    const query: any = {};

    // role restriction
    if (
      user.role ===
        "sales_executive" ||
      user.role === "telecaller"
    ) {
      query.assignedTo = user.userId;
    }

    // admin filters
    if (
      assignedTo &&
      user.role !==
        "sales_executive" &&
      user.role !== "telecaller"
    ) {
      query.assignedTo = assignedTo;
    }

    if (status) {
      query.status = status;
    }

    if (source) {
      query.source = source;
    }

    if (city) {
      query.city = {
        $regex: city,
        $options: "i",
      };
    }

    if (search) {
      query.$or = [
        {
          fullName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip =
      (Number(page) - 1) * Number(limit);

    const [leads, total] = await Promise.all([
      populateLeadQuery(Lead.find(query))
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      Lead.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      leads: serializeLeads(leads),
      total,
      page: Number(page),
      totalPages: Math.ceil(
        total / Number(limit)
      ),
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch kanban leads",
    });
  }
};

export const exportLeads = async (
  req: any,
  res: Response
) => {
  try {
    const {
      source,
      city,
      assignedTo,
      temperature,
    } = req.query;

    const filter: any = buildLeadFilter(req);

    if (source) filter.source = source;
    if (city) filter.city = city;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (temperature) filter.temperature = temperature;

    const leads = await Lead.find(filter)
      .populate(
        "assignedTo",
        "fullName email"
      )
      .sort({ updatedAt: -1 });

    const workbook =
      new ExcelJS.Workbook();

    const worksheet =
      workbook.addWorksheet("Leads");

    worksheet.columns = [
      {
        header: "Name",
        key: "fullName",
        width: 25,
      },
      {
        header: "Phone",
        key: "phone",
        width: 18,
      },
      {
        header: "Email",
        key: "email",
        width: 30,
      },
      {
        header: "City",
        key: "city",
        width: 18,
      },
      {
        header: "Source",
        key: "source",
        width: 18,
      },
      {
        header: "Budget",
        key: "budget",
        width: 15,
      },
      {
        header: "Status",
        key: "status",
        width: 18,
      },
      {
        header: "Temperature",
        key: "temperature",
        width: 15,
      },
      {
        header: "Assigned To",
        key: "assignedTo",
        width: 25,
      },
      {
        header: "Created Date",
        key: "createdAt",
        width: 22,
      },
    ];

    leads.forEach((lead: any) => {
      worksheet.addRow({
        fullName: lead.fullName || "",
        phone: lead.phone || "",
        email: lead.email || "",
        city: lead.city || "",
        source: lead.source || "",
        budget: lead.budget || "",
        status: lead.status || "",
        temperature:
          lead.temperature || "",
        assignedTo:
          lead.assignedTo?.fullName ||
          "Unassigned",
        createdAt:
          lead.createdAt?.toLocaleString() ||
          "",
      });
    });

    worksheet.getRow(1).font = {
      bold: true,
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=leads-export.xlsx`
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message:
        "Failed to export leads",
    });
  }
};

export const importLeads = async (
  req: any,
  res: Response
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Excel/CSV file required",
      });
    }

    const brandId =
      req.user?.brandId ||
      req.user?.brand?._id ||
      req.user?.userId;

    const workbook = XLSX.read(
      req.file.buffer,
      { type: "buffer" }
    );

    const worksheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows: any[] =
      XLSX.utils.sheet_to_json(
        worksheet
      );

    const imported: any[] = [];

   for (let i = 0; i < rows.length; i++) {
  const row: any = rows[i];

  const values = Object.values(row);

  const fullName = String(values[0] || "").trim();
  const phone = String(values[1] || "").trim();
  const email = String(values[2] || "").trim();

  if (!fullName && !phone && !email) {
    continue;
  }

  imported.push({
    fullName: fullName || `Lead ${i + 1}`,
    phone: phone || `NO_PHONE_${i}`,
    email: email || "",
    city: "Unknown",
    source: "csv_import",
    status: "new",
    temperature: "cold",
    brandId,
    projectName: req.body.projectName || "",
  });
}

    if (
      imported.length > 0
    ) {
      await Lead.insertMany(
        imported,
        {
          ordered: false,
        }
      );
    }

    return res.status(200).json({
      success: true,
      importedCount:
        imported.length,
    });
  } catch (error) {
    console.error(
      "IMPORT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Import failed",
      error,
    });
  }
};

export const getAllLeads = async (
  req: any,
  res: Response
) => {
  try {
   const filter =
  buildLeadFilter(req);

const leads =
  await populateLeadQuery(
    Lead.find(filter)
  ).sort({
          updatedAt: -1,
  });

    res.status(200).json({
      success: true,
      count: leads.length,
      leads: serializeLeads(leads),
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch all leads",
      error,
    });
  }
};

export const getAssignedLeads =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const filter =
  buildLeadFilter(req);

filter.assignedTo = {
  $ne: null,
};

const leads =
  await populateLeadQuery(
    Lead.find(filter)
  ).sort({
    updatedAt: -1,
  });

      res.status(200).json({
        success: true,
        count: leads.length,
        leads: serializeLeads(leads),
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to fetch assigned leads",
        error,
      });
    }
  };
  export const getMyLeads = async (
  req: any,
  res: Response
) => {
  try {
    const user = req.user;

    const filter =
  buildLeadFilter(req);

filter.assignedTo =
  user.userId;

const leads =
  await populateLeadQuery(
    Lead.find(filter)
  ).sort({
    updatedAt: -1,
  });

    res.status(200).json({
      success: true,
      count: leads.length,
      leads: serializeLeads(leads),
    });
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch my leads",
      error,
    });
  }
};

export const capturePublicLead =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const {
        fullName,
        phone,
        email,
        city,
        source,
        sourceType,
        identifier,
        brandId,
      } = req.body;

      if (
        !fullName ||
        !phone ||
        !brandId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Required fields missing",
        });
      }

      let detectedProject =
        null;

      if (
        sourceType &&
        identifier
      ) {
        detectedProject =
          await detectProjectFromSource(
            sourceType,
            identifier,
            brandId
          );
      }

      const existing =
        await Lead.findOne({
          phone: String(
            phone
          ).trim(),
        });

      if (existing) {
        return res.status(200).json({
          success: true,
          message:
            "Duplicate lead ignored",
        });
      }

      const lead =
        await Lead.create({
          fullName,
          phone:
            String(
              phone
            ).trim(),
          email:
            email || "",
          city:
            city || "Unknown",

          source:
            source ||
            "website",

          sourceType:
            sourceType || "",

          identifier:
            identifier || "",

          projectId:
            detectedProject?.projectId,

          projectName:
            detectedProject?.projectName ||
            "",

          status: "new",
          temperature:
            "cold",

          brandId,
        });

      res.status(201).json({
        success: true,
        lead,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Lead capture failed",
      });
    }
  };

  export const metaWebhookVerify =
  async (
    req: Request,
    res: Response
  ) => {
    const VERIFY_TOKEN =
      "my_meta_verify_token";

    const mode =
      req.query[
        "hub.mode"
      ];

    const token =
      req.query[
        "hub.verify_token"
      ];

    const challenge =
      req.query[
        "hub.challenge"
      ];

    if (
      mode ===
        "subscribe" &&
      token ===
        VERIFY_TOKEN
    ) {
      return res
        .status(200)
        .send(challenge);
    }

    res.sendStatus(403);
  };

  export const metaWebhookReceive =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const entries =
        req.body.entry || [];

      for (const entry of entries) {
        for (const change of entry.changes ||
          []) {
          const leadgenId =
            change.value
              ?.leadgen_id;

          const formId =
            change.value
              ?.form_id;

          if (
            !leadgenId ||
            !formId
          ) {
            continue;
          }

          // FETCH ACTUAL LEAD
          const response =
            await axios.get(
              `https://graph.facebook.com/v19.0/${leadgenId}`,
              {
                params: {
                  access_token:
                    process.env.META_ACCESS_TOKEN,
                },
              }
            );

          const fieldData =
            response.data
              ?.field_data || [];

          const getField = (
            name: string
          ) => {
            const field =
              fieldData.find(
                (
                  f: any
                ) =>
                  f.name ===
                  name
              );

            return field?.values?.[0] || "";
          };

          const fullName =
            getField(
              "full_name"
            );

          const phone =
            getField(
              "phone_number"
            );

          const email =
            getField(
              "email"
            );

          const city =
            getField(
              "city"
            );

          // FIND SOURCE MAPPING
          const detectedProject =
            await detectProjectFromSource(
              "meta_form",
              formId,
              change.value
                ?.page_id
            );

          // DUPLICATE CHECK
          const existing =
            await Lead.findOne({
              phone:
                String(
                  phone
                ).trim(),
            });

          if (existing) {
            continue;
          }

          await Lead.create({
            fullName,
            phone:
              String(
                phone
              ).trim(),
            email,
            city:
              city ||
              "Unknown",

            source:
              "facebook_ads",

            sourceType:
              "meta_form",

            identifier:
              formId,

            projectId:
              detectedProject?.projectId,

            projectName:
              detectedProject?.projectName ||
              "",

            status: "new",
            temperature:
              "hot",

            brandId:
              change.value
                ?.page_id,
          });
        }
      }

      res.status(200).send(
        "EVENT_RECEIVED"
      );
    } catch (error) {
      console.error(error);

      res.status(500).send(
        "Webhook error"
      );
    }
  };
  export const bulkAssignLeads =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const user = req.user;

      const allowedRoles = [
        "super_admin",
        "admin",
        "sales_manager",
      ];

      if (
        !allowedRoles.includes(
          user.role
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied",
        });
      }

      const {
        leadIds,
        assignedTo,
      } = req.body;

      if (
        !leadIds ||
        !Array.isArray(
          leadIds
        ) ||
        leadIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Lead IDs required",
        });
      }

      if (!assignedTo) {
        return res.status(400).json({
          success: false,
          message:
            "Assigned user required",
        });
      }

      const result =
        await Lead.updateMany(
          {
            _id: {
              $in: leadIds,
            },
          },
          {
            $set: {
              assignedTo,
              assignedBy:
                user.userId,
              status:
                "assigned",
              updatedAt: new Date(),
            },
          }
        );

      for (const leadId of leadIds) {
        await logLeadActivity({
          leadId: leadId.toString(),
          actionType:
            "lead_reassigned",
          newValue:
            assignedTo.toString(),
          note:
            "Lead bulk assigned",
          performedBy:
            user.userId,
        });
      }

      res.status(200).json({
        success: true,
        message:
          "Leads assigned successfully",
        modifiedCount:
          result.modifiedCount,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Bulk assign failed",
      });
    }
  };
  export const getLeadById = async (
  req: any,
  res: Response
) => {
  try {
    const { id } = req.params;

    const user = req.user;

    const lead = await populateLeadQuery(
      Lead.findById(id)
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message:
          "Lead not found",
      });
    }

    // MY LEADS security
    if (
      user.role ===
        "sales_executive" ||
      user.role ===
        "telecaller"
    ) {
      if (
        String(
          lead.assignedTo?._id
        ) !==
        String(user.userId)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied",
        });
      }
    }

    const activities =
      await LeadActivity.find({
        leadId: id,
      })
        .sort({
          createdAt: -1,
        })
        .populate(
          "performedBy",
          "fullName role"
        );

    res.status(200).json({
      success: true,
      lead: serializeLead(lead),
      activities,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch lead",
    });
  }
};
export const updateLeadStatus =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const user = req.user;

      if (!status) {
        return res.status(400).json({
          success: false,
          message:
            "Status required",
        });
      }

      const lead =
        await Lead.findById(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          message:
            "Lead not found",
        });
      }

      const oldStatus =
        lead.status;

      if (oldStatus !== status) {
        lead.status = status;
      }

      lead.updatedAt = new Date();
      await lead.save();

      await logLeadActivity({
        leadId:
          lead._id.toString(),
        actionType:
          "status_updated",
        oldValue:
          oldStatus,
        newValue:
          status,
        note:
          oldStatus === status
            ? `Lead worked again. Status remained ${status}.`
            : `Status changed from ${oldStatus} to ${status}`,
        performedBy:
          user.userId,
      });

      res.status(200).json({
        success: true,
        message:
          "Status updated successfully",
        lead: serializeLead(lead),
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Status update failed",
      });
    }
  };

export const addLeadNote =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const { note } = req.body;

      const user = req.user;

      if (note === undefined || note === null) {
        return res.status(400).json({
          success: false,
          message:
            "Note required",
        });
      }

      const lead =
        await Lead.findById(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          message:
            "Lead not found",
        });
      }

      const previousNote =
        lead.notes || "";

      lead.notes = note;
      lead.updatedAt = new Date();

      await lead.save();

      await logLeadActivity({
        leadId:
          lead._id.toString(),
        actionType:
          "notes_updated",
        oldValue: previousNote,
        newValue: note,
        note,
        performedBy:
          user.userId,
      });

      res.status(200).json({
        success: true,
        message:
          "Note saved successfully",
        lead: serializeLead(lead),
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message:
          "Note save failed",
      });
    }
  };

 // getemployeeperformance
  export const getEmployeePerformance = async (
  req: any,
  res: Response
) => {
  try {
    const {
      employeeId,
      fromDate,
      toDate,
    } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        message: "Employee Id required",
      });
    }

    const assignedLeads =
      await Lead.countDocuments({
        assignedTo: employeeId,
      });

    const rangeStart = new Date(fromDate);
    const rangeEnd = new Date(
      new Date(toDate).setHours(
        23,
        59,
        59,
        999
      )
    );

    const workedLeads =
      await Lead.countDocuments({
        assignedTo: employeeId,
        updatedAt: {
          $gte: rangeStart,
          $lte: rangeEnd,
        },
      });

    const pendingLeads =
      assignedLeads - workedLeads;

    const leads = await Lead.find({
      assignedTo: employeeId,
      updatedAt: {
        $gte: rangeStart,
        $lte: rangeEnd,
      },
    })
      .populate(
        "assignedTo",
        "fullName"
      )
      .sort({
        updatedAt: -1,
      });

    return res.status(200).json({
      assignedLeads,
      workedLeads,
      pendingLeads,
      leads,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};
const buildLeadFilter = (
  req: any
) => {
  const {
    search,
    status,
    temperature,
    assignedTo,
    dateRange,
    fromDate,
    toDate,
  } = req.query;

  const filter: any = {};
  const today = new Date();

  const applyRange = (start: Date, end?: Date) => {
    filter.updatedAt = end
      ? {
          $gte: start,
          $lte: end,
        }
      : {
          $gte: start,
        };
  };

  if (search) {
    filter.$or = [
      {
        fullName: {
          $regex: search,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (temperature) {
    filter.temperature = temperature;
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (dateRange === "today") {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    applyRange(start, end);
  }

  if (dateRange === "yesterday") {
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    applyRange(start, end);
  }

  if (dateRange === "last7days") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    applyRange(start, end);
  }

  if (dateRange === "last30days") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    applyRange(start, end);
  }

  if (dateRange === "thisMonth") {
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    applyRange(start, end);
  }

  if (dateRange === "lastMonth") {
    const start = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const end = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    );
    end.setHours(23, 59, 59, 999);
    applyRange(start, end);
  }

  if (
    dateRange === "custom" &&
    fromDate &&
    toDate
  ) {
    const start = new Date(fromDate);
    const end = new Date(toDate);

    end.setHours(
      23,
      59,
      59,
      999
    );

    applyRange(start, end);
  }

  return filter;
};
export const createWebsiteLead =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        fullName,
        phone,
        email,
        projectName,
        website,
      } = req.body;

      const lead =
        await Lead.create({
          fullName,
          phone,
          email,
          projectName,
          source: "website",
        });

      return res.status(201).json({
        success: true,
        lead,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          "Failed to create lead",
      });
    }
  };

export const deleteLead = async (
  req: any,
  res: Response
) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { id } = req.params;

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    await Promise.all([
      LeadActivity.deleteMany({ leadId: id }),
      FollowUp.deleteMany({ leadId: id }),
      CallLog.deleteMany({ leadId: id }),
    ]);

    await Lead.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
    });
  }
};