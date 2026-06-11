import bcrypt from "bcryptjs";
import User from "../../models/auth/User";

const allowedRoles = ["super_admin", "admin"] as const;
const validUserRoles = [
  "super_admin",
  "admin",
  "sales_manager",
  "sales_executive",
  "telecaller",
] as const;

type UserRole = (typeof validUserRoles)[number];
type AllowedRole = (typeof allowedRoles)[number];

const isAllowedRole = (role: string): role is AllowedRole => {
  return allowedRoles.includes(role as AllowedRole);
};

const isUserRole = (role: string): role is UserRole => {
  return validUserRoles.includes(role as UserRole);
};

const checkAccess = (user: any) => {
  const role = String(user?.role || "")
    .trim()
    .toLowerCase();

  return isAllowedRole(role);
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

    const normalizedFullName = String(fullName || "").trim();
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const normalizedPhone = String(phone || "").trim();
    const normalizedPassword = String(password || "");
    const normalizedRole = String(role || "")
      .trim()
      .toLowerCase();
    const normalizedCity = String(city || "").trim();

    if (
      !normalizedFullName ||
      !normalizedEmail ||
      !normalizedPhone ||
      !normalizedPassword ||
      !normalizedRole
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    if (!isUserRole(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already exists"
            : "Phone already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      normalizedPassword,
      10
    );

    const user = await User.create({
      fullName: normalizedFullName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: normalizedRole,
      city: normalizedCity,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    });
  } catch (error: any) {
    console.error("CREATE USER ERROR:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create user",
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
export const getTeamMembers =
  async (
    req: any,
    res: any
  ) => {
    try {
      const users =
        await User.find(
          {
            role: {
              $in: [
                "sales_executive",
                "telecaller",
              ],
            },
          },
          "-password"
        ).sort({
          fullName: 1,
        });

      res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Failed to fetch team members",
      });
    }
  };