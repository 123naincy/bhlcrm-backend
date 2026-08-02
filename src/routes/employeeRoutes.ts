import express from "express";
import User from "../models/auth/User";
import { protect } from "../middleware/auth/authMiddleware";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const employees = await User.find(
      {
        role: {
          $in: [
            "admin",
            "sales_manager",
            "sales_executive",
            "telecaller",
          ],
        },
        isActive: true,
      },
      {
        fullName: 1,
        email: 1,
        role: 1,
        phone: 1,
        city: 1,
      }
    ).sort({
      fullName: 1,
    });

    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error(
      "Employee fetch error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch employees",
    });
  }
});

export default router;