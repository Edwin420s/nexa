"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const handleValidationError = (err, res) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return res.status(400).json({
        status: 'fail',
        message,
    });
};
const handleDuplicateFieldsDB = (err, res) => {
    const value = err.errmsg.match(/(["'])(\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return res.status(400).json({
        status: 'fail',
        message,
    });
};
const handleJWTError = (res) => res.status(401).json({
    status: 'fail',
    message: 'Invalid token. Please log in again!',
});
const handleJWTExpiredError = (res) => res.status(401).json({
    status: 'fail',
    message: 'Your token has expired! Please log in again.',
});
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.error('Error:', {
            error: err,
            stack: err.stack,
        });
    }
    let error = { ...err, message: err.message };
    if (error.name === 'ValidationError')
        return handleValidationError(error, res);
    if (error.code === 11000)
        return handleDuplicateFieldsDB(error, res);
    if (error.name === 'JsonWebTokenError')
        return handleJWTError(res);
    if (error.name === 'TokenExpiredError')
        return handleJWTExpiredError(res);
    if (error.isOperational) {
        return res.status(error.statusCode).json({
            status: error.status,
            message: error.message,
        });
    }
    logger_1.default.error('ERROR 💥', error);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
    });
};
exports.errorHandler = errorHandler;
