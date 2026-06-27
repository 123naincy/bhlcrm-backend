import Customer, {
  ICustomer,
} from "../../models/inventory/Customer";
import { Types } from "mongoose";

class CustomerService {
  /**
   * Create Customer
   */
  async createCustomer(
    data: Partial<ICustomer>,
    session?: any
  ) {
    const customer = await Customer.create(
      [data],
      session ? { session } : {}
    );

    return customer[0];
  }

  /**
   * Update Customer
   */
  async updateCustomer(
    id: string,
    data: Partial<ICustomer>,
    session?: any
  ) {
    return await Customer.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        session,
      }
    );
  }

  /**
   * Get Customer By Id
   */
  async getCustomerById(id: string) {
    return await Customer.findById(id);
  }

  /**
   * Search Customer
   */
  async searchCustomer(search: string) {
    return await Customer.find({
      $or: [
        {
          firstName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          lastName: {
            $regex: search,
            $options: "i",
          },
        },
        {
          mobile: {
            $regex: search,
            $options: "i",
          },
        },
        {
          customerCode: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    }).limit(20);
  }

  /**
   * Get All Customers
   */
  async getCustomers(
    filter: any = {}
  ) {
    return await Customer.find(filter)
      .sort({
        createdAt: -1,
      });
  }

  /**
   * Check Duplicate Customer
   */
  async findDuplicate(
    mobile: string,
    panNumber: string,
    aadhaarNumber: string
  ) {
    return await Customer.findOne({
      $or: [
        { mobile },
        { panNumber },
        { aadhaarNumber },
      ],
    });
  }

  /**
   * Generate Customer Code
   * Example : CUS-000001
   */
  async generateCustomerCode() {
    const count =
      await Customer.countDocuments();

    return `CUS-${String(
      count + 1
    ).padStart(6, "0")}`;
  }

  /**
   * Delete Customer
   */
  async deleteCustomer(
    id: string
  ) {
    return await Customer.findByIdAndDelete(
      id
    );
  }
}

export default new CustomerService();