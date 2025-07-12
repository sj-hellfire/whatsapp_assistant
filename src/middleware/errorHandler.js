/**
 * Error handling middleware for the WhatsApp AI Assistant
 */

// Error types
const ErrorTypes = {
    VALIDATION: 'VALIDATION',
    AUTHENTICATION: 'AUTHENTICATION',
    AUTHORIZATION: 'AUTHORIZATION',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMIT: 'RATE_LIMIT',
    EXTERNAL_API: 'EXTERNAL_API',
    DATABASE: 'DATABASE',
    WHATSAPP: 'WHATSAPP',
    AI: 'AI',
    UNKNOWN: 'UNKNOWN'
};

/**
 * Custom error class
 */
class AppError extends Error {
    constructor(message, type = ErrorTypes.UNKNOWN, statusCode = 500, details = null) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Validation error
 */
class ValidationError extends AppError {
    constructor(message, details = null) {
        super(message, ErrorTypes.VALIDATION, 400, details);
        this.name = 'ValidationError';
    }
}

/**
 * Authentication error
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, ErrorTypes.AUTHENTICATION, 401);
        this.name = 'AuthenticationError';
    }
}

/**
 * Authorization error
 */
class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, ErrorTypes.AUTHORIZATION, 403);
        this.name = 'AuthorizationError';
    }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, ErrorTypes.NOT_FOUND, 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Rate limit error
 */
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, ErrorTypes.RATE_LIMIT, 429);
        this.name = 'RateLimitError';
    }
}

/**
 * WhatsApp error
 */
class WhatsAppError extends AppError {
    constructor(message, details = null) {
        super(message, ErrorTypes.WHATSAPP, 500, details);
        this.name = 'WhatsAppError';
    }
}

/**
 * AI service error
 */
class AIError extends AppError {
    constructor(message, details = null) {
        super(message, ErrorTypes.AI, 500, details);
        this.name = 'AIError';
    }
}

/**
 * Error handler middleware
 */
function errorHandler(err, req, res, next) {
    // Log error
    console.error('Error:', {
        message: err.message,
        type: err.type || ErrorTypes.UNKNOWN,
        statusCode: err.statusCode || 500,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Determine error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    
    // Don't expose internal errors in production
    const response = {
        error: {
            message: statusCode === 500 ? 'Internal server error' : message,
            type: err.type || ErrorTypes.UNKNOWN,
            timestamp: new Date().toISOString()
        }
    };

    // Add details in development
    if (process.env.NODE_ENV === 'development') {
        response.error.details = err.details;
        response.error.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * Async error wrapper
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Validate required fields
 */
function validateRequired(fields, data) {
    const missing = [];
    
    for (const field of fields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(', ')}`, { missing });
    }
}

/**
 * Sanitize and validate input
 */
function sanitizeAndValidate(input, schema) {
    const sanitized = {};
    const errors = [];
    
    for (const [key, rules] of Object.entries(schema)) {
        const value = input[key];
        
        if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            errors.push(`${key} is required`);
            continue;
        }
        
        if (value !== undefined && value !== null) {
            let sanitizedValue = value;
            
            // Type conversion
            if (rules.type === 'string') {
                sanitizedValue = String(value).trim();
            } else if (rules.type === 'number') {
                sanitizedValue = Number(value);
                if (isNaN(sanitizedValue)) {
                    errors.push(`${key} must be a valid number`);
                    continue;
                }
            } else if (rules.type === 'boolean') {
                sanitizedValue = Boolean(value);
            }
            
            // Validation
            if (rules.minLength && sanitizedValue.length < rules.minLength) {
                errors.push(`${key} must be at least ${rules.minLength} characters`);
            }
            
            if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
                errors.push(`${key} must be no more than ${rules.maxLength} characters`);
            }
            
            if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
                errors.push(`${key} format is invalid`);
            }
            
            sanitized[key] = sanitizedValue;
        }
    }
    
    if (errors.length > 0) {
        throw new ValidationError('Validation failed', { errors });
    }
    
    return sanitized;
}

module.exports = {
    ErrorTypes,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    WhatsAppError,
    AIError,
    errorHandler,
    asyncHandler,
    validateRequired,
    sanitizeAndValidate
}; 