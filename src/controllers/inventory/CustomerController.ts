import { Request, Response } from "express";
import customerService from "../../services/inventory/customer.service";

class CustomerController {
  /**
   * Create Customer
   */
  async createCustomer(
    req: Request,
    res: Response
  ) {
    try {
      const customer =
        await customerService.createCustomer(
          req.body
        );

      return res.status(201).json({
        success: true,
        message: "Customer created successfully.",
        data: customer,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to create customer.",
      });
    }
  }

  /**
   * Get All Customers
   */
  async getCustomers(
    req: Request,
    res: Response
  ) {
    try {
      const customers =
        await customerService.getCustomers();

      return res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get Customer By ID
   */
  async getCustomer(
    req: Request,
    res: Response
  ) {
    try {
      const customer =
        await customerService.getCustomerById(
          String(req.params.id)
        );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found.",
        });
      }

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update Customer
   */
  async updateCustomer(
    req: Request,
    res: Response
  ) {
    try {
      const customer =
        await customerService.updateCustomer(
          String(req.params.id),
          req.body
        );

      return res.status(200).json({
        success: true,
        message:
          "Customer updated successfully.",
        data: customer,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Search Customer
   */
  async searchCustomer(
    req: Request,
    res: Response
  ) {
    try {
      const search =
        (req.query.search as string) || "";

      const customers =
        await customerService.searchCustomer(
          search
        );

      return res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete Customer
   */
  async deleteCustomer(
    req: Request,
    res: Response
  ) {
    try {
      await customerService.deleteCustomer(
        String(req.params.id)
      );

      return res.status(200).json({
        success: true,
        message:
          "Customer deleted successfully.",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new CustomerController();