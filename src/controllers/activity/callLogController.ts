import { Request, Response } from "express";
import CallLog from "../../models/activity/CallLog";
import { logLeadActivity } from "../../utils/logLeadActivity";

interface AuthRequest extends Request {
  user?: any;
}

export const createCallLog = async (
  req: AuthRequest,
  res: Response
) => {
  try {
   const {
  leadId,
  phone,
  callType,
  callStatus,
  duration,
  recordingUrl,
} = req.body;

    const callLog = await CallLog.create({
  leadId,
  phone,
  callType,
  callStatus:
    callStatus ||
    (duration > 0
      ? "ANSWERED"
      : "NOT_ANSWERED"),

  duration,

  recordingUrl,

  summary: "",

  summaryStatus:
    recordingUrl
      ? "PENDING"
      : "FAILED",

  agentId: req.user.userId,

  callDate: new Date(),
});
    if (leadId) {
      await logLeadActivity({
        leadId: leadId.toString(),
        actionType: "notes_updated",
        newValue: callType || "call",
        note: recordingUrl
          ? "Call recording saved"
          : "Call log saved",
        performedBy: req.user.userId,
      });
    }

    console.log(
      "SAVED CALL LOG =",
      JSON.stringify(callLog, null, 2)
    );

    return res.status(201).json({
      success: true,
      message: "Call log saved successfully",
      data: callLog,
    });

  } catch (error: any) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const getMyCallLogs =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {

      const logs =
        await CallLog.find({
          agentId: req.user.userId,
        })
          .populate(
            "leadId",
            "fullName phone"
          )
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: logs.length,
        logs,
      });

    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

export const getLeadCallLogs =
  async (
    req: Request,
    res: Response
  ) => {
    try {

      const { leadId } =
        req.params;

      const logs =
        await CallLog.find({
          leadId,
        })
          .sort({
            createdAt: -1,
          });

      return res.json({
        success: true,
        count: logs.length,
        logs,
      });

    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
