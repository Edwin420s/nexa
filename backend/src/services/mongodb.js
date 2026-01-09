"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.disconnectDB = exports.connectDB = void 0;
// services/mongodb.ts
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexa';
        const options = {
            autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4 // Use IPv4, skip trying IPv6
        };
        await mongoose_1.default.connect(mongoURI, options);
        logger_1.default.info('MongoDB connected successfully');
        // Connection events
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.default.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.default.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.default.info('MongoDB reconnected');
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        logger_1.default.error('MongoDB connection failed:', errorMessage);
        // Exit process with failure
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.disconnect();
        logger_1.default.info('MongoDB disconnected');
    }
    catch (error) {
        logger_1.default.error('Error disconnecting MongoDB:', error);
    }
};
exports.disconnectDB = disconnectDB;
// Handle graceful shutdown
process.on('SIGINT', async () => {
    await (0, exports.disconnectDB)();
    process.exit(0);
});
exports.db = mongoose_1.default.connection;
