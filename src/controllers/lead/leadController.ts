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
import {
  detectProjectFromSource,
  detectMetaLeadMapping,
  detectWebsiteLeadMapping,
} from "../../utils/detectProjectFromSource";
import { extractProjectName } from "../../utils/leadProjectUtils";
import {
  getScheduledDate,
  requiresScheduleDate,
} from "../../utils/leadScheduleUtils";
import crypto from "crypto";


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
      campaignName,
      adSetName,
      adName,
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

        campaignName:
          typeof campaignName === "string"
            ? campaignName.trim()
            : "",

        adSetName:
          typeof adSetName === "string"
            ? adSetName.trim()
            : "",

        adName:
          typeof adName === "string"
            ? adName.trim()
            : "",

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

    const movingToScheduleStatus =
      status !== undefined &&
      status !== oldStatus &&
      requiresScheduleDate(status);

    if (movingToScheduleStatus) {
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
    const user = req.user;
    const allowedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const mode = req.query.mode ?? "all";

    if (!["all", "assigned", "my"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead mode",
      });
    }

    const filter: any = buildLeadFilter(req);

    if (mode === "assigned" && !filter.assignedTo) {
      filter.assignedTo = { $ne: null };
    }

    if (mode === "my") {
      if (!user.userId) {
        return res.status(403).json({
          success: false,
          message: "Invalid user",
        });
      }

      filter.assignedTo = user.userId;
    }

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
        header: "Project Name",
        key: "projectName",
        width: 30,
      },
      {
        header: "Source",
        key: "source",
        width: 18,
      },
      {
        header: "Campaign Name",
        key: "campaignName",
        width: 35,
      },
      {
        header: "Ad Set Name",
        key: "adSetName",
        width: 35,
      },
      {
        header: "Ad Name",
        key: "adName",
        width: 35,
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
      projectName: extractProjectName(lead) || "",
      worksheet.addRow({
        fullName: lead.fullName || "",
        phone: lead.phone || "",
        email: lead.email || "",
        city: lead.city || "",
        source: lead.source || "",
        campaignName: lead.campaignName || "",
        adSetName: lead.adSetName || "",
        adName: lead.adName || "",
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
        campaignName: String(
          row["Campaign Name"] ??
          row["campaignName"] ??
          row["campaign_name"] ??
          ""
        ).trim(),

        adSetName: String(
          row["Ad Set Name"] ??
          row["Adset Name"] ??
          row["adSetName"] ??
          row["adset_name"] ??
          ""
        ).trim(),

        adName: String(
          row["Ad Name"] ??
          row["adName"] ??
          row["ad_name"] ??
          ""
        ).trim(),
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

      if (!filter.assignedTo) {
        filter.assignedTo = {
          $ne: null,
        };
      }

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

export const getLeadFilterOptions = async (
  req: any,
  res: Response
) => {
  try {
    const user = req.user;
    const mode = req.query.mode ?? "my";

    const privilegedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    const allowedRoles = [
      ...privilegedRoles,
      "sales_executive",
      "telecaller",
    ];

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (!["all", "assigned", "my"].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead mode",
      });
    }

    const isPrivileged = privilegedRoles.includes(user.role);

    if (mode !== "my" && !isPrivileged) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const baseFilter: any = {};

    if (mode === "my") {
      if (!user.userId) {
        return res.status(403).json({
          success: false,
          message: "Invalid user",
        });
      }

      baseFilter.assignedTo = user.userId;
    } else if (mode === "assigned") {
      baseFilter.assignedTo = { $ne: null };
    }

    const clean = (value: unknown): string =>
      typeof value === "string"
        ? value.trim()
        : "";

    const projectName = clean(req.query.projectName);
    const source = clean(req.query.source);
    const campaignName = clean(req.query.campaignName);
    const adSetName = clean(req.query.adSetName);

    // Project and source-wise campaigns
    const campaignFilter = {
      ...baseFilter,
      ...(projectName ? { projectName } : {}),
      ...(source ? { source } : {}),
    };

    // Campaign-wise ad sets
    const adSetFilter = {
      ...campaignFilter,
      ...(campaignName ? { campaignName } : {}),
    };

    // Ad set-wise ads
    const adFilter = {
      ...adSetFilter,
      ...(adSetName ? { adSetName } : {}),
    };

    const [
      projects,
      sources,
      sourceTypes,
      campaigns,
      adSets,
      adNames,
      cities,
      propertyTypes,
      budgets,
      brands,
    ] = await Promise.all([
      Lead.distinct("projectName", baseFilter),
      Lead.distinct("source", baseFilter),
      Lead.distinct("sourceType", baseFilter),
      Lead.distinct("campaignName", campaignFilter),
      Lead.distinct("adSetName", adSetFilter),
      Lead.distinct("adName", adFilter),
      Lead.distinct("city", baseFilter),
      Lead.distinct("propertyType", baseFilter),
      Lead.distinct("budget", baseFilter),
      Lead.distinct("brandId", baseFilter),
    ]);

    const cleanOptions = (values: unknown[]) =>
      [...new Set(
        values
          .map((value) => String(value ?? ""))
          .filter((value) => value.trim() !== "")
      )].sort((a, b) => a.localeCompare(b));

    return res.status(200).json({
      success: true,
      options: {
        projects: cleanOptions(projects),
        sources: cleanOptions(sources),
        sourceTypes: cleanOptions(sourceTypes),
        campaigns: cleanOptions(campaigns),
        adSets: cleanOptions(adSets),
        adNames: cleanOptions(adNames),
        cities: cleanOptions(cities),
        propertyTypes: cleanOptions(propertyTypes),
        budgets: cleanOptions(budgets),
        brands: cleanOptions(brands),
      },
    });
  } catch (error) {
    console.error("Filter options error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lead filter options",
    });
  }
};

export const capturePublicLead = async (req: any, res: Response) => {
  try {
    const { fullName, phone, email, city, source, sourceType, identifier, brandId } = req.body;
    if (!fullName || !phone || !brandId) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    let detectedProject = null;
    if (sourceType && identifier) {
      detectedProject = await detectProjectFromSource(sourceType, identifier, brandId);
    }

    const normalizedPhone = String(phone).trim();
    const existing = await Lead.findOne({ phone: normalizedPhone });
    if (existing) {
      return res.status(200).json({ success: true, message: "Duplicate lead ignored" });
    }

    const lead = await Lead.create({
      fullName,
      phone: normalizedPhone,
      email: email || "",
      city: city || "Unknown",
      source: source || "website",
      sourceType: sourceType || "",
      identifier: identifier || "",
      projectId: detectedProject?.projectId,
      projectName: detectedProject?.projectName || "",
      status: "new",
      temperature: "cold",
      brandId,
    });
    return res.status(201).json({ success: true, lead });
  } catch (error) {
    console.error("Public lead capture failed:", error);
    return res.status(500).json({ success: false, message: "Lead capture failed" });
  }
};

export const metaWebhookVerify = (req: Request, res: Response) => {
  const token = process.env.META_VERIFY_TOKEN;
  if (
    token &&
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === token &&
    typeof req.query["hub.challenge"] === "string"
  ) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  return res.sendStatus(403);
};

const verifyMetaWebhookSignature = (req: Request): boolean => {
  const secret = process.env.META_APP_SECRET;
  const signature = req.header("x-hub-signature-256");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!secret || !signature || !Buffer.isBuffer(rawBody)) return false;
  if (!/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;

  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const actualBuffer = Buffer.from(signature.toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

export async function fetchMetaLead(
  leadgenId: string,
  webhookAdId = "",
  webhookAdSetId = "",
  webhookCampaignId = ""
) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const marketingToken =
    process.env.META_MARKETING_ACCESS_TOKEN || token;

  const version =
    process.env.META_GRAPH_API_VERSION || "v27.0";

  if (!token) {
    throw new Error("META_PAGE_ACCESS_TOKEN is missing");
  }

  if (!leadgenId) {
    throw new Error("leadgenId is missing");
  }

  const baseUrl =
    `https://graph.facebook.com/${version}`;

  const basicFields =
    "id,created_time,field_data,form_id";

  const campaignFields =
    "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name";

  const graphGet = async (
    id: string,
    fields: string,
    accessToken: string
  ) => {
    const response = await axios.get(
      `${baseUrl}/${encodeURIComponent(id)}`,
      {
        params: {
          fields,
          access_token: accessToken,
        },
        timeout: 10000,
      }
    );

    return response.data;
  };

  const logMetaError = (
    label: string,
    error: any
  ) => {
    const metaError = error?.response?.data?.error;

    console.warn(label, {
      code: metaError?.code,
      subcode: metaError?.error_subcode,
      message: metaError?.message || "Request failed",
    });
  };

  let metaLead: any;

  // STEP 1: Fetch lead with campaign details
  try {
    metaLead = await graphGet(
      leadgenId,
      `${basicFields},${campaignFields}`,
      token
    );
  } catch (error) {
    logMetaError(
      "META: Extended lead fetch failed",
      error
    );

    // Preserve existing lead capture
    metaLead = await graphGet(
      leadgenId,
      basicFields,
      token
    );
  }

  // STEP 2: Collect available attribution IDs
  let adId = String(
    metaLead?.ad_id || webhookAdId || ""
  );

  let adSetId = String(
    metaLead?.adset_id || webhookAdSetId || ""
  );

  let campaignId = String(
    metaLead?.campaign_id || webhookCampaignId || ""
  );

  let adName = String(
    metaLead?.ad_name || ""
  ).trim();

  let adSetName = String(
    metaLead?.adset_name || ""
  ).trim();

  let campaignName = String(
    metaLead?.campaign_name || ""
  ).trim();

  // STEP 3: Fetch attribution directly from Ad ID
  if (
    adId &&
    marketingToken &&
    (!adName ||
      !adSetName ||
      !campaignName ||
      !adSetId ||
      !campaignId)
  ) {
    try {
      const ad = await graphGet(
        adId,
        "id,name,adset_id,campaign_id,adset{id,name},campaign{id,name}",
        marketingToken
      );

      adName = adName || ad?.name || "";

      adSetId =
        adSetId ||
        ad?.adset_id ||
        ad?.adset?.id ||
        "";

      campaignId =
        campaignId ||
        ad?.campaign_id ||
        ad?.campaign?.id ||
        "";

      adSetName =
        adSetName || ad?.adset?.name || "";

      campaignName =
        campaignName || ad?.campaign?.name || "";

    } catch (error) {
      logMetaError(
        "META: Ad details fetch failed",
        error
      );
    }
  }

  // STEP 4: Fetch Ad Set name separately
  if (adSetId && marketingToken && (!adSetName || !campaignId)) {
    try {
      const adSet = await graphGet(
        adSetId,
        "id,name,campaign_id",
        marketingToken
      );

      adSetName = adSetName || adSet?.name || "";

      campaignId =
        campaignId || adSet?.campaign_id || "";

    } catch (error) {
      logMetaError(
        "META: Ad Set fetch failed",
        error
      );
    }
  }

  // STEP 5: Fetch Campaign name separately
  if (campaignId && marketingToken && !campaignName) {
    try {
      const campaign = await graphGet(
        campaignId,
        "id,name",
        marketingToken
      );

      campaignName = campaign?.name || "";

    } catch (error) {
      logMetaError(
        "META: Campaign fetch failed",
        error
      );
    }
  }

  console.log("META ATTRIBUTION:", {
    leadgenId,
    adId,
    adName,
    adSetId,
    adSetName,
    campaignId,
    campaignName,
  });

  return {
    ...metaLead,
    ad_id: adId,
    ad_name: adName,
    adset_id: adSetId,
    adset_name: adSetName,
    campaign_id: campaignId,
    campaign_name: campaignName,
  };
}

export const metaWebhookReceive = async (req: Request, res: Response) => {
  if (!verifyMetaWebhookSignature(req)) {
    console.error("META WEBHOOK: invalid signature or raw body not configured");
    return res.sendStatus(403);
  }

  if (req.body?.object !== "page") {
    return res.status(200).send("EVENT_RECEIVED");
  }

  const configuredPageId = process.env.META_PAGE_ID;
  if (!configuredPageId || !process.env.META_PAGE_ACCESS_TOKEN) {
    console.error("META WEBHOOK: META_PAGE_ID or META_PAGE_ACCESS_TOKEN missing");
    return res.sendStatus(503);
  }

  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    for (const entry of entries) {
      if (String(entry?.id || "") !== configuredPageId) {
        console.warn("META WEBHOOK: unexpected Page ID");
        continue;
      }

      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        if (change?.field !== "leadgen") continue;

        const leadgenId = String(change?.value?.leadgen_id || "");
        const formId = String(change?.value?.form_id || "");
        const pageId = String(change?.value?.page_id || entry.id);
        if (!leadgenId || !formId || pageId !== configuredPageId) {
          console.warn("META WEBHOOK: invalid leadgen event");
          continue;
        }

        // Form mapping must exist BEFORE creating a lead.
        const mapping = await detectMetaLeadMapping(formId);
        if (!mapping?.brandId || !mapping?.projectId) {
          throw new Error(`Missing or ambiguous active Meta Form mapping for ${formId}`);
        }

       const webhookAdId = String(
  change?.value?.ad_id || ""
);

const webhookAdSetId = String(
  change?.value?.adset_id || ""
);

const webhookCampaignId = String(
  change?.value?.campaign_id || ""
);

console.log("META WEBHOOK ATTRIBUTION:", {
  leadgenId,
  formId,
  webhookAdId,
  webhookAdSetId,
  webhookCampaignId,
});

const metaLead = await fetchMetaLead(
  leadgenId,
  webhookAdId,
  webhookAdSetId,
  webhookCampaignId
);
        if (metaLead?.form_id && String(metaLead.form_id) !== formId) {
          throw new Error(`Meta Form ID mismatch for lead ${leadgenId}`);
        }

        const fieldData: any[] = Array.isArray(metaLead?.field_data) ? metaLead.field_data : [];
        const getField = (...names: string[]) => {
          const field = fieldData.find((f: any) => names.includes(String(f?.name || "")));
          return String(field?.values?.[0] || "").trim();
        };

        const fullName = getField("full_name", "name") ||
          [getField("first_name"), getField("last_name")].filter(Boolean).join(" ") ||
          "Meta Lead";
        const normalizedPhone = getField("phone_number", "phone");
        const email = getField("email");
        const city = getField("city");
        const campaignName = String(
          metaLead?.campaign_name || ""
        ).trim();

        const adSetName = String(
          metaLead?.adset_name || ""
        ).trim();

        const adName = String(
          metaLead?.ad_name || ""
        ).trim();
        if (!normalizedPhone) {
          throw new Error(`Phone missing for Meta lead ${leadgenId}`);
        }

        // Preserve your existing CRM's phone-based duplicate rule.
        // For true Meta event idempotency, add a unique metaLeadId field to Lead schema later.
        const existing = await Lead.findOne({ phone: normalizedPhone });
        if (existing) {
          console.log("META WEBHOOK: phone already exists; lead skipped");
          continue;
        }

        const lead = await Lead.create({
          fullName,
          phone: normalizedPhone,
          email,
          city: city || "Unknown",

          source: "facebook_ads",
          sourceType: "meta_form",
          identifier: formId,

          campaignName,
          adSetName,
          adName,

          projectId: mapping.projectId,
          projectName: mapping.projectName,
          brandId: mapping.brandId,

          status: "new",
          temperature: "hot",

          extraFields: {
            campaignId: String(metaLead?.campaign_id || ""),
            adSetId: String(metaLead?.adset_id || ""),
            adId: String(metaLead?.ad_id || ""),
            metaLeadId: leadgenId,
          },
        });
        console.log("META WEBHOOK: lead created", String(lead._id));
      }
    }
    return res.status(200).send("EVENT_RECEIVED");
  } catch (error: any) {
    console.error("META WEBHOOK processing failed:", error?.response?.data || error?.message || error);
    return res.status(500).send("Webhook processing failed");
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
const buildLeadFilter = (req: any) => {
  const {
    search,
    status,
    temperature,
    assignedTo,
    dateRange,
    fromDate,
    toDate,

    // Project & Source Filters
    brandId,
    projectId,
    projectName,
    source,
    sourceType,
    identifier,

    // Campaign Filters
    campaignName,
    adSetName,
    adName,
    keyword,

    // Customer Filters
    city,
    propertyType,
    budget,
    isDuplicate,
  } = req.query;

  const filter: any = {};
  const today = new Date();

  const clean = (value: unknown): string =>
    typeof value === "string"
      ? value.trim()
      : "";

  const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  // ==============================
  // GLOBAL SEARCH
  // ==============================

  if (clean(search)) {
    const searchValue = escapeRegex(clean(search));

    const searchFields = [
      "fullName",
      "phone",
      "alternatePhone",
      "email",
      "projectName",
      "campaignName",
      "adSetName",
      "adName",
      "city",
    ];

    filter.$or = searchFields.map((field) => ({
      [field]: {
        $regex: searchValue,
        $options: "i",
      },
    }));
  }

  // ==============================
  // BRAND & PROJECT FILTERS
  // ==============================

  if (clean(brandId)) {
    filter.brandId = clean(brandId);
  }

  if (clean(projectId)) {
    filter.projectId = clean(projectId);
  }

  if (clean(projectName)) {
    filter.projectName = clean(projectName);
  }

  // ==============================
  // SOURCE FILTERS
  // ==============================

  if (clean(source)) {
    filter.source = clean(source);
  }

  if (clean(sourceType)) {
    filter.sourceType = clean(sourceType);
  }

  if (clean(identifier)) {
    filter.identifier = clean(identifier);
  }

  // ==============================
  // CAMPAIGN FILTERS
  // ==============================

  if (clean(campaignName)) {
    filter.campaignName = clean(campaignName);
  }

  if (clean(adSetName)) {
    filter.adSetName = clean(adSetName);
  }

  if (clean(adName)) {
    filter.adName = clean(adName);
  }

  if (clean(keyword)) {
    filter.keyword = clean(keyword);
  }

  // ==============================
  // STATUS & TEMPERATURE
  // ==============================

  if (clean(status)) {
    filter.status = clean(status);
  }

  if (clean(temperature)) {
    filter.temperature = clean(temperature);
  }

  // ==============================
  // TEAM MEMBER FILTER
  // ==============================

  if (clean(assignedTo)) {
    filter.assignedTo = clean(assignedTo);
  }

  // ==============================
  // CUSTOMER FILTERS
  // ==============================

  if (clean(city)) {
    filter.city = {
      $regex: `^${escapeRegex(clean(city))}$`,
      $options: "i",
    };
  }

  if (clean(propertyType)) {
    filter.propertyType = clean(propertyType);
  }

  if (clean(budget)) {
    filter.budget = clean(budget);
  }

  // ==============================
  // DUPLICATE LEADS
  // ==============================

  if (isDuplicate === "true") {
    filter.isDuplicate = true;
  }

  if (isDuplicate === "false") {
    filter.isDuplicate = false;
  }

  // ==============================
  // DATE FILTERS
  // ==============================

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
    clean(fromDate) &&
    clean(toDate)
  ) {
    const start = new Date(clean(fromDate));
    const end = new Date(clean(toDate));

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      start <= end
    ) {
      applyRange(start, end);
    }
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
        city,
        brandId,
        sourceType,
        identifier,
        projectId,
        projectName,
      } = req.body;

      if (!fullName || !phone || !brandId) {
        return res.status(400).json({
          success: false,
          message: "Required fields missing",
        });
      }

      let detectedProject = null;
      if (sourceType && identifier) {
        detectedProject = await detectProjectFromSource(
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
          city: city || "Unknown",
          projectId: detectedProject?.projectId || projectId,
          projectName: detectedProject?.projectName || projectName || "",
          brandId,
          source: "website",
          sourceType: sourceType || "",
          identifier: identifier || "",
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

export const createLandingPageLead = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      fullName,
      phone,
      email,
      identifier,
      interest,
      consent,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      campaign_id,
      adset_id,
      adset_name,
      ad_id,
      placement,
      landingPage,
    } = req.body || {};

    const clean = (value: unknown, max = 200): string =>
      typeof value === "string"
        ? value.trim().slice(0, max)
        : "";

    const normalizedName = clean(fullName, 60);
    const normalizedEmail = clean(email, 254).toLowerCase();
    const normalizedIdentifier = clean(identifier, 100);

    const normalizedPhone = clean(phone, 30)
      .replace(/[\s-]/g, "")
      .replace(/^\+91/, "")
      .replace(/^91(?=[6-9]\d{9}$)/, "");

    // 1. Required fields
    if (
      normalizedName.length < 2 ||
      !normalizedPhone ||
      !normalizedIdentifier
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // 2. Phone validation
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number",
      });
    }

    // 3. Email validation
    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    // 4. Interest validation
    if (!["Investment", "Self Use"].includes(interest)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer interest",
      });
    }

    // 5. Consent validation
    if (consent !== true) {
      return res.status(400).json({
        success: false,
        message: "Customer consent is required",
      });
    }

    // 6. Automatic brand and project mapping
    const mapping = await detectWebsiteLeadMapping(
      normalizedIdentifier
    );

    if (!mapping?.brandId || !mapping?.projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid landing page configuration",
      });
    }

    // 7. Duplicate detection within the same project
    const existing = await Lead.findOne({
      brandId: mapping.brandId,
      projectId: mapping.projectId,
      phone: {
        $in: [
          normalizedPhone,
          `+91${normalizedPhone}`,
          `91${normalizedPhone}`,
          `+91 ${normalizedPhone}`,
          `+91-${normalizedPhone}`,
        ],
      },
    }).select("_id");

    // 8. Create lead
    const lead = await Lead.create({
      fullName: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail,
      city: "Unknown",

      brandId: mapping.brandId,
      projectId: mapping.projectId,
      projectName: mapping.projectName,

      source: "landing_page",
      sourceType: "landing_page",
      identifier: normalizedIdentifier,

      campaignName: clean(utm_campaign),
      adSetName: clean(adset_name),
      adName: clean(utm_content),
      keyword: clean(utm_term),

      status: existing ? "duplicate" : "new",
      temperature: "cold",
      isDuplicate: Boolean(existing),

      extraFields: {
        interest: clean(interest),
        consent: true,
        consentAt: new Date().toISOString(),

        utm_source: clean(utm_source),
        utm_medium: clean(utm_medium),
        utm_campaign: clean(utm_campaign),
        utm_content: clean(utm_content),
        campaignId: clean(campaign_id),
        adSetId: clean(adset_id),
        adId: clean(ad_id),
        placement: clean(placement),
        platform: clean(utm_source),

        landingPage: clean(landingPage, 500),
      },
    });

    console.log(
      "WEBSITE LEAD: created",
      String(lead._id)
    );

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
    });

  } catch (error) {
    console.error(
      "WEBSITE LEAD: creation failed",
      error instanceof Error ? error.name : "Unknown error"
    );

    return res.status(500).json({
      success: false,
      message: "Unable to submit enquiry",
    });
  }
};
