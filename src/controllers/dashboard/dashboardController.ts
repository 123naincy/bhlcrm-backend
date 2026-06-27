import { Response } from "express";
import Lead from "../../models/lead/Lead";
import mongoose from "mongoose";
import User from "../../models/auth/User";
import LeadActivity from "../../models/activity/LeadActivity";
import FollowUp from "../../models/followup/FollowUp";

async function getFollowUpUpdateCounts() {
  const [
    activityCounts,
    noteCounts,
  ] = await Promise.all([
    LeadActivity.aggregate([
      {
        $match: {
          $or: [
            {
              actionType:
                "followup_updated",
            },
            {
              actionType:
                "notes_updated",
            },
            {
              actionType:
                "status_updated",
              newValue: "follow_up",
            },
            {
              actionType:
                "status_updated",
              newValue: "contacted",
            },
          ],
        },
      },
      {
        $group: {
          _id: "$performedBy",
          count: { $sum: 1 },
        },
      },
    ]),

    FollowUp.aggregate([
      {
        $group: {
          _id: "$createdBy",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const counts = new Map<
    string,
    number
  >();

  for (const row of activityCounts) {
    if (!row._id) continue;

    const id = row._id.toString();

    counts.set(
      id,
      (counts.get(id) || 0) +
        row.count
    );
  }

  for (const row of noteCounts) {
    if (!row._id) continue;

    const id = row._id.toString();

    counts.set(
      id,
      (counts.get(id) || 0) +
        row.count
    );
  }

  return counts;
}

async function getTopFollowUpPerformer(
  performanceRows: any[] = []
) {
  const followUpCounts =
    await getFollowUpUpdateCounts();

  const teamUsers =
    await User.find({
      role: {
        $in: [
          "sales_executive",
          "telecaller",
          "sales_manager",
        ],
      },
      $or: [
        { isActive: true },
        { isActive: { $exists: false } },
      ],
    }).select("_id fullName role");

  const ranking = teamUsers
    .map((user) => ({
      employeeId: user._id,
      employeeName: user.fullName,
      role: user.role,
      followUpUpdates:
        followUpCounts.get(
          user._id.toString()
        ) || 0,
    }))
    .sort(
      (a, b) =>
        b.followUpUpdates -
        a.followUpUpdates
    );

  const top = ranking[0];

  if (top && top.followUpUpdates > 0) {
    return top;
  }

  const fromPerformance = [
    ...performanceRows,
  ]
    .sort(
      (a, b) =>
        (b.followUpUpdates || 0) -
          (a.followUpUpdates || 0) ||
        (b.workedLeads || 0) -
          (a.workedLeads || 0) ||
        (b.assignedLeads || 0) -
          (a.assignedLeads || 0)
    )
    .find(
      (row) =>
        row.role ===
          "sales_executive" ||
        row.role === "telecaller"
    );

  if (fromPerformance) {
    return {
      employeeId:
        fromPerformance.employeeId,
      employeeName:
        fromPerformance.employeeName,
      role: fromPerformance.role,
      followUpUpdates:
        fromPerformance.followUpUpdates ||
        0,
    };
  }

  if (top) {
    return top;
  }

  return null;
}

function getTodayRange() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return {
    startOfToday,
    endOfToday,
  };
}

async function countTodayStatusUpdates() {
  const {
    startOfToday,
    endOfToday,
  } = getTodayRange();

  const teamUsers =
    await User.find({
      role: {
        $in: [
          "sales_executive",
          "telecaller",
        ],
      },
    }).select("_id");

  const teamIds =
    teamUsers.map(
      (user) => user._id
    );

  if (!teamIds.length) {
    return 0;
  }

  return LeadActivity.countDocuments(
    {
      actionType:
        "status_updated",
      performedBy: {
        $in: teamIds,
      },
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    }
  );
}

async function countPendingAssignedLeads() {
  const teamUsers =
    await User.find({
      role: {
        $in: [
          "sales_executive",
          "telecaller",
        ],
      },
    }).select("_id");

  const teamIds =
    teamUsers.map(
      (user) => user._id
    );

  if (!teamIds.length) {
    return 0;
  }

  const workedLeadIds =
    await LeadActivity.distinct(
      "leadId",
      {
        actionType:
          "status_updated",
      }
    );

  return Lead.countDocuments({
    assignedTo: {
      $in: teamIds,
    },

    status: {
      $nin: [
        "won",
        "lost",
        "junk",
      ],
    },

    _id: {
      $nin: workedLeadIds,
    },
  });
}

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
    const {
      startOfToday,
      endOfToday,
    } = getTodayRange();

    // Parallel DB queries
    const [
      totalLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      wonLeads,
      lostLeads,
      todayLeads,
      todayStatusUpdates,
      pendingLeads,
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

      countTodayStatusUpdates(),

      countPendingAssignedLeads(),

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
      todayLeads:
        todayStatusUpdates,
      todayNewLeads: todayLeads,
      todayStatusUpdates,
      pendingLeads,
      pendingFollowups,
      pendingAssignedLeads:
        pendingLeads,
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
export const getTeamPerformance = async (
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

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const performance = await Lead.aggregate([
      {
        $match: {
          assignedTo: {
            $exists: true,
            $ne: null,
          },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "employee",
        },
      },

      {
        $unwind: "$employee",
      },

      {
        $match: {
          "employee.role": {
            $in: [
              "sales_executive",
              "telecaller",
            ],
          },
        },
      },

      {
        $group: {
          _id: "$assignedTo",

          employeeName: {
            $first:
              "$employee.fullName",
          },

          role: {
            $first:
              "$employee.role",
          },

          assignedLeads: {
            $sum: 1,
          },

          hotLeads: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$temperature",
                    "hot",
                  ],
                },
                1,
                0,
              ],
            },
          },

          wonLeads: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$status",
                    "won",
                  ],
                },
                1,
                0,
              ],
            },
          },
workedLeads: {
  $sum: {
    $cond: [
      {
        $or: [
          { $eq: ["$status", "contacted"] },
          { $eq: ["$status", "follow_up"] },
          { $eq: ["$status", "interested"] },
          {
            $eq: [
              "$status",
              "site_visit_scheduled",
            ],
          },
          {
            $eq: [
              "$status",
              "site_visit_done",
            ],
          },
          {
            $eq: [
              "$status",
              "negotiation",
            ],
          },
          { $eq: ["$status", "won"] },
          { $eq: ["$status", "lost"] },
        ],
      },
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

          employeeId: "$_id",

          employeeName: 1,

          role: 1,

          assignedLeads: 1,

          workedLeads: 1,

          pendingLeads: {
            $subtract: [
              "$assignedLeads",
              "$workedLeads",
            ],
          },

          hotLeads: 1,

          wonLeads: 1,

          conversionRate: {
            $cond: [
              {
                $eq: [
                  "$assignedLeads",
                  0,
                ],
              },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          "$workedLeads",
                          "$assignedLeads",
                        ],
                      },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },

      {
        $sort: {
          conversionRate: -1,
        },
      },
    ]);

    const followUpCounts =
      await getFollowUpUpdateCounts();

    const performanceWithFollowUps =
      performance.map(
        (row) => ({
          ...row,
          followUpUpdates:
            followUpCounts.get(
              row.employeeId?.toString() ||
                ""
            ) || 0,
        })
      );

    const topPerformer =
      await getTopFollowUpPerformer(
        performanceWithFollowUps
      );

    return res.status(200).json({
      success: true,
      count:
        performanceWithFollowUps.length,
      performance:
        performanceWithFollowUps,
      topPerformer,
    });
  } catch (error: any) {
    console.error(
      "TEAM PERFORMANCE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch team performance",
    });
  }
};
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

export const getMyDashboard = async (
  req: any,
  res: Response
) => {
  try {
    const userId = req.user.userId;

    const [
      totalLeads,
      newLeads,
      contacted,
      followUp,
      interested,
      siteVisitScheduled,
      siteVisitDone,
      won,
      lost,
    ] = await Promise.all([
      Lead.countDocuments({
        assignedTo: userId,
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "new",
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "contacted",
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "follow_up",
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "interested",
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "site_visit_scheduled",
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "site_visit_done",
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "won",
      }),

      Lead.countDocuments({
        assignedTo: userId,
        status: "lost",
      }),
    ]);

    return res.status(200).json({
      success: true,

      totalLeads,
      newLeads,
      contacted,
      followUp,
      interested,
      siteVisitScheduled,
      siteVisitDone,
      won,
      lost,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getMyRecentFollowups = async (
  req: any,
  res: Response
) => {
  try {
    const leads = await Lead.find({
      assignedTo: req.user.userId,
      status: "follow_up",
    })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select(
        "fullName status phone updatedAt"
      );

    res.status(200).json({
      success: true,
      leads,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};
export const getMyMonthlyTrend = async (
  req: any,
  res: Response
) => {
  try {
    const trend =
      await Lead.aggregate([
        {
          $match: {
            assignedTo:
              new mongoose.Types.ObjectId(
                req.user.userId
              ),
          },
        },

        {
          $group: {
            _id: {
              month: {
                $month:
                  "$createdAt",
              },
            },

            leads: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]);

   return res.status(200).json({
  success: true,
  trend,
});
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
};
export const getTodayFollowups =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date();

      end.setHours(
        23,
        59,
        59,
        999
      );

      const count =
        await Lead.countDocuments(
          {
            assignedTo:
              req.user.userId,

            followUpDate: {
              $gte: start,
              $lte: end,
            },
          }
        );

      res.json({
        count,
      });
    } catch (error) {
      res.status(500).json({
        message:
          "Server Error",
      });
    }
  };
  export const getManagerSummary =
  async (
    req: any,
    res: Response
  ) => {
    try {
      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );

      const end =
        new Date();

      end.setHours(
        23,
        59,
        59,
        999
      );

      const teamUsers =
        await User.find({
          role: {
            $in: [
              "sales_executive",
              "telecaller",
            ],
          },
        }).select("_id");

      const teamIds =
        teamUsers.map(
          (u) => u._id
        );

      const totalTeamLeads =
        await Lead.countDocuments({
          assignedTo: {
            $in: teamIds,
          },
        });

      const workedToday =
        await Lead.countDocuments({
          assignedTo: {
            $in: teamIds,
          },
          updatedAt: {
            $gte: start,
            $lte: end,
          },
        });

      const followupsToday =
        await Lead.countDocuments({
          assignedTo: {
            $in: teamIds,
          },
          followUpDate: {
            $gte: start,
            $lte: end,
          },
        });

      const interestedLeads =
        await Lead.countDocuments({
          assignedTo: {
            $in: teamIds,
          },
          status:
            "interested",
        });

      return res.json({
        totalTeamLeads,
        workedToday,
        followupsToday,
        interestedLeads,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Server Error",
      });
    }
  };