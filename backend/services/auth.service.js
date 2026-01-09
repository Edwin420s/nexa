"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
class AuthService {
    /**
     * Register a new user
     */
    static async register(userData) {
        try {
            // Check if user already exists
            const existingUser = await User_1.User.findOne({ email: userData.email });
            if (existingUser) {
                throw new errors_1.BadRequestError('Email already in use');
            }
            // Create new user
            const user = new User_1.User({
                email: userData.email,
                password: userData.password,
                name: userData.name
            });
            await user.save();
            // Generate JWT token
            const token = this.generateToken(user);
            return { user, token };
        }
        catch (error) {
            logger_1.default.error('Error in AuthService.register:', error);
            throw error;
        }
    }
    /**
     * Login user
     */
    static async login(email, password) {
        try {
            // Check if user exists
            const user = await User_1.User.findOne({ email });
            if (!user) {
                throw new errors_1.UnauthorizedError('Invalid credentials');
            }
            // Check password
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                throw new errors_1.UnauthorizedError('Invalid credentials');
            }
            // Generate JWT token
            const token = this.generateToken(user);
            return { user, token };
        }
        catch (error) {
            logger_1.default.error('Error in AuthService.login:', error);
            throw error;
        }
    }
    /**
     * Verify JWT token
     */
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (error) {
            logger_1.default.error('Error verifying token:', error);
            throw new errors_1.UnauthorizedError('Invalid or expired token');
        }
    }
    /**
     * Generate JWT token
     */
    static generateToken(user) {
        const payload = {
            userId: user._id.toString(),
            email: user.email
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }
    /**
     * Get current user
     */
    static async getCurrentUser(userId) {
        try {
            return await User_1.User.findById(userId).select('-password');
        }
        catch (error) {
            logger_1.default.error('Error in AuthService.getCurrentUser:', error);
            throw error;
        }
    }
    /**
     * Update user profile
     */
    static async updateProfile(userId, updates) {
        try {
            const allowedUpdates = ['name', 'avatar', 'settings'];
            const updatesToApply = Object.keys(updates).reduce((acc, key) => {
                if (allowedUpdates.includes(key)) {
                    acc[key] = updates[key];
                }
                return acc;
            }, {});
            const user = await User_1.User.findByIdAndUpdate(userId, { $set: updatesToApply }, { new: true, runValidators: true }).select('-password');
            return user;
        }
        catch (error) {
            logger_1.default.error('Error in AuthService.updateProfile:', error);
            throw error;
        }
    }
    /**
     * Change password
     */
    static async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await User_1.User.findById(userId);
            if (!user) {
                throw new errors_1.BadRequestError('User not found');
            }
            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                throw new errors_1.BadRequestError('Current password is incorrect');
            }
            // Update password
            user.password = newPassword;
            await user.save();
        }
        catch (error) {
            logger_1.default.error('Error in AuthService.changePassword:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
