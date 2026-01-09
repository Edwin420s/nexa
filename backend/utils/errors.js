"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidJsonHandler = exports.notFoundHandler = exports.errorHandler = exports.ServiceUnavailableError = exports.InternalServerError = exports.RateLimitError = exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(errors) {
        super('Validation Error', 422);
        this.errors = errors;
    }
}
exports.ValidationError = ValidationError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests, please try again later.') {
        super(message, 429);
    }
}
exports.RateLimitError = RateLimitError;
class InternalServerError extends AppError {
    constructor(message = 'Internal Server Error') {
        super(message, 500);
    }
}
exports.InternalServerError = InternalServerError;
class ServiceUnavailableError extends AppError {
    constructor(message = 'Service Unavailable') {
        super(message, 503);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }
    else {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });
        }
        else {
            // Programming or other unknown error: don't leak error details
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong!',
            });
        }
    }
};
exports.errorHandler = errorHandler;
// Handle 404 errors
const notFoundHandler = (req, res, next) => {
    next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
};
exports.notFoundHandler = notFoundHandler;
// Handle invalid JSON payloads
const invalidJsonHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid JSON payload',
        });
    }
    next();
};
exports.invalidJsonHandler = invalidJsonHandler;
