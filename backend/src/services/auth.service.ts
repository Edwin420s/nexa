import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { UnauthorizedError, BadRequestError } from '../utils/errors';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

interface TokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  static async register(userData: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ user: IUser; token: string }> {
    try {
      logger.info('Attempting to register user with email:', userData.email);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase().trim() });
      logger.info('Existing user found:', existingUser ? 'YES' : 'NO');
      
      if (existingUser) {
        throw new BadRequestError('Email already in use');
      }

      // Create new user
      const user = new User({
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        name: userData.name.trim()
      });

      logger.info('Saving new user...');
      await user.save();
      logger.info('User saved successfully with ID:', user._id);

      // Generate JWT token
      const token = this.generateToken(user);

      return { user, token };
    } catch (error) {
      logger.error('Error in AuthService.register:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    try {
      logger.info('Attempting login for email:', email);
      
      // Check if user exists
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      logger.info('User found for login:', user ? 'YES' : 'NO');
      
      if (!user) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      logger.info('Password match:', isMatch ? 'YES' : 'NO');
      
      if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);
      logger.info('Login successful for user ID:', user._id);

      return { user, token };
    } catch (error) {
      logger.error('Error in AuthService.login:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      logger.error('Error verifying token:', error);
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(user: IUser): string {
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email
    };

    const secret: jwt.Secret = JWT_SECRET;
    const options: jwt.SignOptions = { expiresIn: JWT_EXPIRE };
    return jwt.sign(payload, secret, options);
  }

  /**
   * Get current user
   */
  static async getCurrentUser(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId).select('-password');
    } catch (error) {
      logger.error('Error in AuthService.getCurrentUser:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Pick<IUser, 'name' | 'avatar' | 'settings'>>
  ): Promise<IUser | null> {
    try {
      const allowedUpdates = ['name', 'avatar', 'settings'];
      const updatesToApply = Object.keys(updates).reduce((acc, key) => {
        if (allowedUpdates.includes(key)) {
          acc[key] = updates[key as keyof typeof updates];
        }
        return acc;
      }, {} as Record<string, any>);

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updatesToApply },
        { new: true, runValidators: true }
      ).select('-password');

      return user;
    } catch (error) {
      logger.error('Error in AuthService.updateProfile:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new BadRequestError('User not found');
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        throw new BadRequestError('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();
    } catch (error) {
      logger.error('Error in AuthService.changePassword:', error);
      throw error;
    }
  }
}
