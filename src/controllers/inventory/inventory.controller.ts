import { Request, Response } from "express";
import inventoryService from "../../services/inventory/inventory.service";

class InventoryController {
  /**
   * Inventory Dashboard
   */
  async getInventory(
    req: Request,
    res: Response
  ) {
    try {
      const inventory =
        await inventoryService.getInventory(
          req.query
        );

      return res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Inventory Details
   */
  async getInventoryById(
    req: Request,
    res: Response
  ) {
    try {
      const inventory =
        await inventoryService.getInventoryById(
          String(req.params.id)
        );

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: "Inventory not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Create Inventory
   */
  async createInventory(
    req: Request,
    res: Response
  ) {
    try {
      const inventory =
        await inventoryService.createInventory(
          req.body,
          req.user.id
        );

      return res.status(201).json({
        success: true,
        message:
          "Inventory created successfully.",
        data: inventory,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update Inventory
   */
  async updateInventory(
    req: Request,
    res: Response
  ) {
    try {
      const inventory =
        await inventoryService.updateInventory(
          String(req.params.id),
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Inventory updated successfully.",
        data: inventory,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Change Status
   */
  async changeInventoryStatus(
    req: Request,
    res: Response
  ) {
    try {
      const inventory =
        await inventoryService.changeStatus(
          String(req.params.id),
          req.body.status
        );

      return res.status(200).json({
        success: true,
        message:
          "Inventory status updated successfully.",
        data: inventory,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete Inventory
   */
  async deleteInventory(
    req: Request,
    res: Response
  ) {
    try {
      await inventoryService.deleteInventory(
        String(req.params.id)
      );

      return res.status(200).json({
        success: true,
        message:
          "Inventory deleted successfully.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new InventoryController();