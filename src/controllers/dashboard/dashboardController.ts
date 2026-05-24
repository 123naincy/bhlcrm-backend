import { Response } from "express";
import Lead from "../../models/lead/Lead";

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const user = req.user;

    // Access control
    const allowedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // Today's date range
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Parallel DB queries
    const [
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      wonLeads,
      lostLeads,
      todayLeads,
      pendingFollowups,
      contactedLeads,
      followUpLeads,
    ] = await Promise.all([
      Lead.countDocuments(),

      Lead.countDocuments({
        temperature: "hot",
      }),

      Lead.countDocuments({
        temperature: "warm",
      }),

      Lead.countDocuments({
        temperature: "cold",
      }),

      Lead.countDocuments({
        status: "won",
      }),

      Lead.countDocuments({
        status: "lost",
      }),

      Lead.countDocuments({
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }),

      Lead.countDocuments({
        followUpDate: {
          $exists: true,
          $ne: null,
        },
        status: {
          $nin: ["won", "lost", "junk"],
        },
      }),

      Lead.countDocuments({ status: "contacted" }),

      Lead.countDocuments({ status: "follow_up" }),
    ]);

    res.status(200).json({
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      wonLeads,
      lostLeads,
      todayLeads,
      pendingFollowups,
      followUpLeads,
      contactedLeads,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};

//  getTeamPerformance

export const getTeamPerformance = async (req: any, res: Response) => {
  try {
    const user = req.user;

    const allowedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const performance = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $exists: true },
        },
      },

      {
        $group: {
          _id: "$assignedTo",
          assignedLeads: { $sum: 1 },

          hotLeads: {
            $sum: {
              $cond: [
                { $eq: ["$temperature", "hot"] },
                1,
                0,
              ],
            },
          },

          wonLeads: {
            $sum: {
              $cond: [
                { $eq: ["$status", "won"] },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },

      {
        $unwind: "$employee",
      },

      {
        $project: {
          _id: 0,
          employeeId: "$employee._id",
          employeeName: "$employee.fullName",
          email: "$employee.email",
          role: "$employee.role",
          assignedLeads: 1,
          hotLeads: 1,
          wonLeads: 1,
        },
      },

      {
        $sort: {
          assignedLeads: -1,
        },
      },
    ]);

    const teamPerformance = performance.map((row) => ({
      name: row.employeeName,
      leadCount: row.assignedLeads,
      ...row,
    }));

    res.status(200).json({
      count: performance.length,
      performance,
      teamPerformance,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};


// getSourcePerformance

export const getSourcePerformance = async (req: any, res: Response) => {
  try {
    const user = req.user;

    const allowedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
    ];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const performance = await Lead.aggregate([
      {
        $group: {
          _id: "$source",
          totalLeads: { $sum: 1 },

          hotLeads: {
            $sum: {
              $cond: [
                { $eq: ["$temperature", "hot"] },
                1,
                0,
              ],
            },
          },

          wonLeads: {
            $sum: {
              $cond: [
                { $eq: ["$status", "won"] },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          source: "$_id",
          totalLeads: 1,
          hotLeads: 1,
          wonLeads: 1,
        },
      },

      {
        $sort: {
          totalLeads: -1,
        },
      },
    ]);

    const sourcePerformance = performance.map((row) => ({
      _id: row.source,
      count: row.totalLeads,
      ...row,
    }));

    res.status(200).json({
      count: performance.length,
      performance,
      sourcePerformance,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
};