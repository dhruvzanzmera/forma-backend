/**
 * Standardized API Response Helper
 */
class ApiResponse {
  constructor(statusCode, message = 'Success', data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== null && data !== undefined) {
      this.data = data;
    }
    if (meta !== null && meta !== undefined) {
      this.meta = meta;
    }
  }

  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const payload = new ApiResponse(statusCode, message, data, meta);
    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res, message = 'Resource deleted successfully') {
    return res.status(200).json(new ApiResponse(200, message));
  }
}

module.exports = ApiResponse;
