import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { registerSchema, loginSchema, validate } from '../utils/validation';
import { ValidationError, AuthenticationError, ConflictError } from '../utils/errors';
import { validateRequest } from '../middleware/validate';
import logger from '../utils/logger';

const router = Router();

// Register
router.post('/register', validateRequest(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        const user = await User.create({
            email,
            password,
            name
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        logger.info(`User registered: ${email}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', validateRequest(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new AuthenticationError('Invalid credentials');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new AuthenticationError('Invalid credentials');
        }

        if (!user.isActive) {
            throw new AuthenticationError('Account is deactivated');
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET!,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Update last active
        user.usage.lastActive = new Date();
        await user.save();

        logger.info(`User logged in: ${email}`);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            throw new AuthenticationError('No token provided');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        res.json({
            success: true,
            data: { user: user.toJSON() }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
