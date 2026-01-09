"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const validation_1 = require("../utils/validation");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// Register new user
router.post('/register', async (req, res, next) => {
    try {
        const { error } = (0, validation_1.validateRegister)(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const { email, password, name } = req.body;
        // Check if user exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        // Create user
        const user = await User_1.User.create({
            email,
            password,
            name
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
        logger_1.default.info(`User registered: ${user.email}`);
        res.status(201).json({
            success: true,
            data: {
                user: user.toJSON(),
                token
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Login user
router.post('/login', async (req, res, next) => {
    try {
        const { error } = (0, validation_1.validateLogin)(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const { email, password } = req.body;
        // Find user
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
        logger_1.default.info(`User logged in: ${user.email}`);
        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                token
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Get current user
router.get('/me', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user.toJSON()
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});
// Update user profile
router.put('/profile', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { name, settings } = req.body;
        const user = await User_1.User.findByIdAndUpdate(decoded.id, { $set: { name, settings } }, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user.toJSON()
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
