export default class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errors?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 400 Bad Request
   */
  static badRequest(
    message = "Bad Request",
    errors?: any
  ) {
    return new AppError(message, 400, errors);
  }

  /**
   * 401 Unauthorized
   */
  static unauthorized(
    message = "Unauthorized"
  ) {
    return new AppError(message, 401);
  }

  /**
   * 403 Forbidden
   */
  static forbidden(
    message = "Forbidden"
  ) {
    return new AppError(message, 403);
  }

  /**
   * 404 Not Found
   */
  static notFound(
    message = "Resource Not Found"
  ) {
    return new AppError(message, 404);
  }

  /**
   * 409 Conflict
   */
  static conflict(
    message = "Conflict"
  ) {
    return new AppError(message, 409);
  }

  /**
   * 422 Validation Error
   */
  static validation(
    message = "Validation Failed",
    errors?: any
  ) {
    return new AppError(message, 422, errors);
  }

  /**
   * 500 Server Error
   */
  static internal(
    message = "Internal Server Error"
  ) {
    return new AppError(message, 500);
  }
}