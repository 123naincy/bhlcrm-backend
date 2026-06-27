import { Request, Response } from "express";
import dashboardService from "../../services/inventory/dashboard.service";

class DashboardController {
  async getDashboard(
    req: Request,
    res: Response
  ) {
    try {
      const dashboard =
        await dashboardService.getDashboard();

      return res.status(200).json({
        success: true,
        data: dashboard,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load inventory dashboard.",
      });
    }
  }

  async getSummary(
    req: Request,
    res: Response
  ) {
    try {
      const summary =
        await dashboardService.getSummary();

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to load inventory summary.",
      });
    }
  }
}

export default new DashboardController();
