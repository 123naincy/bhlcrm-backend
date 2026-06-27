import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import AppError from "../utils/AppError";
import { ApiResponse } from "../services/ApiResponse";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  /**
   * Custom App Error
   */
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json(
        ApiResponse.error(
          err.message,
          err.errors
        )
      );
  }

  /**
   * Zod Validation Error
   */
  if (err instanceof ZodError) {
    const errors = (err as any).issues.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res
      .status(422)
      .json(
        ApiResponse.error(
          "Validation Failed",
          errors
        )
      );
  }

  /**
   * Mongo Validation Error
   */
  if (
    err instanceof mongoose.Error.ValidationError
  ) {
    const errors = Object.values(
      err.errors
    ).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));

    return res
      .status(422)
      .json(
        ApiResponse.error(
          "Validation Failed",
          errors
        )
      );
  }

  /**
   * Invalid ObjectId
   */
  if (
    err instanceof mongoose.Error.CastError
  ) {
    return res
      .status(400)
      .json(
        ApiResponse.error(
          "Invalid ID."
        )
      );
  }

  /**
   * Duplicate Key Error
   */
  if (err.code === 11000) {
    const field = Object.keys(
      err.keyValue
    )[0];

    return res
      .status(409)
      .json(
        ApiResponse.error(
          `${field} already exists.`
        )
      );
  }

  /**
   * JWT Error
   */
  if (
    err instanceof jwt.JsonWebTokenError
  ) {
    return res
      .status(401)
      .json(
        ApiResponse.error(
          "Invalid Token."
        )
      );
  }

  /**
   * JWT Expired
   */
  if (
    err instanceof jwt.TokenExpiredError
  ) {
    return res
      .status(401)
      .json(
        ApiResponse.error(
          "Token Expired."
        )
      );
  }

  /**
   * Unknown Error
   */
  return res
    .status(500)
    .json(
      ApiResponse.error(
        "Internal Server Error"
      )
    );
};

export default errorHandler;