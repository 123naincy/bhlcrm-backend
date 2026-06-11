import { Request, Response, NextFunction } from "express";

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    const userRole = String(user?.role || "")
      .trim()
      .toLowerCase();

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized access",
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Access forbidden. Insufficient permissions.",
      });
    }

    next();
  };
};