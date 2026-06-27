export class ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: any;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    errors?: any,
    meta?: any
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
    this.meta = meta;
  }

  static success<T>(
    message: string,
    data?: T,
    meta?: any
  ) {
    return new ApiResponse<T>(
      true,
      message,
      data,
      undefined,
      meta
    );
  }

  static error(
    message: string,
    errors?: any
  ) {
    return new ApiResponse(
      false,
      message,
      undefined,
      errors
    );
  }
}