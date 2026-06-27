import { Request, Response } from "express";
import holdService from "../../services/inventory/hold.service";

class HoldController {
  /**
   * Create Hold
   */
  async createHold(
    req: Request,
    res: Response
  ) {
    try {
      const hold = await holdService.createHold(
        req.body,
        req.user.id
      );

      return res.status(201).json({
        success: true,
        message: "Inventory placed on hold successfully.",
        data: hold,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Failed to create hold.",
      });
    }
  }

  /**
   * Release Hold
   */
  async releaseHold(
    req: Request,
    res: Response
  ) {
    try {
      await holdService.releaseHold(
        String(req.params.id),
        req.user.id
      );

      return res.status(200).json({
        success: true,
        message: "Hold released successfully.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message || "Failed to release hold.",
      });
    }
  }

  /**
   * Get Hold Details
   */
  async getHold(
    req: Request,
    res: Response
  ) {
    try {
      const hold = await holdService.getHold(
        String(req.params.id)
      );

      if (!hold) {
        return res.status(404).json({
          success: false,
          message: "Hold not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: hold,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get All Active Holds
   */
  async getHolds(
    req: Request,
    res: Response
  ) {
    try {
      const holds =
        await holdService.getAllHolds();

      return res.status(200).json({
        success: true,
        data: holds,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Extend Hold
   */
  async extendHold(
    req: Request,
    res: Response
  ) {
    try {
      const hold =
        await holdService.extendHold(
          String(req.params.id),
          req.body.expiryDate,
          req.user.id
        );

      return res.status(200).json({
        success: true,
        message:
          "Hold extended successfully.",
        data: hold,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new HoldController();