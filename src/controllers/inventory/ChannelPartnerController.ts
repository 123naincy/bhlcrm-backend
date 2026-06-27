import { Request, Response } from "express";
import channelPartnerService from "../../services/inventory/channelPartner.service";

class ChannelPartnerController {
  /**
   * Create Channel Partner
   */
  async createPartner(
    req: Request,
    res: Response
  ) {
    try {
      const partner =
        await channelPartnerService.createPartner(
          req.body
        );

      return res.status(201).json({
        success: true,
        message:
          "Channel Partner created successfully.",
        data: partner,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to create channel partner.",
      });
    }
  }

  /**
   * Get All Channel Partners
   */
  async getPartners(
    req: Request,
    res: Response
  ) {
    try {
      const partners =
        await channelPartnerService.getPartners();

      return res.status(200).json({
        success: true,
        data: partners,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get Partner By ID
   */
  async getPartner(
    req: Request,
    res: Response
  ) {
    try {
      const partner =
        await channelPartnerService.getPartnerById(
          String(req.params.id)
        );

      if (!partner) {
        return res.status(404).json({
          success: false,
          message:
            "Channel Partner not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: partner,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update Partner
   */
  async updatePartner(
    req: Request,
    res: Response
  ) {
    try {
      const partner =
        await channelPartnerService.updatePartner(
          String(req.params.id),
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Channel Partner updated successfully.",
        data: partner,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Search Partner
   */
  async searchPartner(
    req: Request,
    res: Response
  ) {
    try {
      const search =
        (req.query.search as string) || "";

      const partners =
        await channelPartnerService.searchPartner(
          search
        );

      return res.status(200).json({
        success: true,
        data: partners,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Change Partner Status
   */
  async changeStatus(
    req: Request,
    res: Response
  ) {
    try {
      const partner =
        await channelPartnerService.updatePartner(
          String(req.params.id),
          {
            status: req.body.status,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Status updated successfully.",
        data: partner,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new ChannelPartnerController();