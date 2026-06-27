import FollowUp from "../../models/followup/FollowUp";
import { logLeadActivity } from "../../utils/logLeadActivity";

export const createFollowUp = async (
  req: any,
  res: any
) => {
  try {
    const {
      leadId,
      noteType,
      note,
      nextFollowUp,
    } = req.body;

    if (!leadId || !noteType || !note) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const userId =
      req.user.userId ||
      req.user.id;

    const followUp = await FollowUp.create({
      leadId,
      noteType,
      note,
      nextFollowUp,
      createdBy: userId,
    });

    await logLeadActivity({
      leadId,
      actionType: "notes_updated",
      newValue: noteType,
      note,
      performedBy: userId,
    });

    res.status(201).json({
      success: true,
      followUp,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create follow-up",
    });
  }
};

export const getLeadFollowUps = async (
  req: any,
  res: any
) => {
  try {
    const followUps = await FollowUp.find({
      leadId: req.params.leadId,
    })
      .populate("createdBy", "fullName role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      followUps,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch follow-ups",
    });
  }
};

export const updateFollowUp = async (
  req: any,
  res: any
) => {
  try {
    const followUp =
      await FollowUp.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      );

    res.status(200).json({
      success: true,
      followUp,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

export const deleteFollowUp = async (
  req: any,
  res: any
) => {
  try {
    await FollowUp.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};