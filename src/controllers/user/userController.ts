import bcrypt from "bcryptjs";
import User from "../../models/auth/User";

const allowedRoles = ["super_admin", "admin"];

const checkAccess = (user: any) => {
  return allowedRoles.includes(user.role);
};

/**
 * GET ALL USERS
 */
export const getUsers = async (req: any, res: any) => {
  try {
    if (!checkAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const users = await User.find({}, "-password").sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/**
 * GET SINGLE USER
 */
export const getUserById = async (
  req: any,
  res: any
) => {
  try {
    if (!checkAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(
      req.params.id,
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

/**
 * CREATE USER
 */
export const createUser = async (req: any, res: any) => {
  try {
    if (!checkAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const {
      fullName,
      email,
      phone,
      password,
      role,
      city,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role,
      city,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

/**
 * UPDATE USER
 */
export const updateUser = async (req: any, res: any) => {
  try {
    if (!checkAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const {
      fullName,
      phone,
      role,
      city,
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        fullName,
        phone,
        role,
        city,
      },
      {
        new: true,
      }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "User updated",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

/**
 * TOGGLE STATUS
 */
export const toggleUserStatus = async (
  req: any,
  res: any
) => {
  try {
    if (!checkAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User status updated",
      user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

// delete user

export const deleteUser = async (
  req: any,
  res: any
) => {
  try {
    if (!checkAccess(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};