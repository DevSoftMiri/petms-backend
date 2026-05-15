const { HTTP_STATUS } = require('./constants');

/**
 * Standardized API Response Helper
 * 
 * Usage:
 * res.status(200).json(apiResponse.success({ data, message: 'Success' }));
 * res.status(400).json(apiResponse.error('Bad Request', HTTP_STATUS.BAD_REQUEST));
 */
const apiResponse = {
  /**
   * Success response
   * @param {object} options - { data, message, pagination }
   */
  success: (options = {}) => {
    const {
      data = null,
      message = 'Operation successful',
      pagination = null,
    } = options;

    const response = {
      success: true,
      message,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return response;
  },

  /**
   * Error response
   * @param {string} message
   * @param {number} statusCode
   * @param {string} code
   * @param {array} errors
   */
  error: (message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, code = 'ERROR', errors = null) => {
    const response = {
      success: false,
      message,
      statusCode,
      code,
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  },

  /**
   * Paginated response
   * @param {array} data
   * @param {number} page
   * @param {number} limit
   * @param {number} total
   * @param {string} message
   */
  paginated: (data, page, limit, total, message = 'Data retrieved successfully') => {
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },
};

/**
 * Helper functions that directly send responses
 */
const successResponse = (res, statusCode = 200, message = 'Operation successful', data = null) => {
  return res.status(statusCode).json(apiResponse.success({ data, message }));
};

const errorResponse = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
  return res.status(statusCode).json(apiResponse.error(message, statusCode, 'ERROR', errors));
};

module.exports = apiResponse;
module.exports.successResponse = successResponse;
module.exports.errorResponse = errorResponse;
