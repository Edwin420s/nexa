import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  projects: mongoose.Types.ObjectId[];
  settings: {
    emailNotifications: boolean;
    defaultModel: string;
    theme: 'light' | 'dark';
    language: string;
  };
  subscription: {
    tier: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
  };
  usage: {
    projectsCreated: number;
    tokensUsed: number;
    lastActive: Date;
  };
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateResetToken(): string;
}

interface IUserModel extends Model<IUser> {
  hashPassword(password: string): Promise<string>;
}

const UserSchema = new Schema<IUser, IUserModel>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  projects: [{
    type: Schema.Types.ObjectId,
    ref: 'Project'
  }],
  settings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    defaultModel: {
      type: String,
      default: 'gemini-2.5-flash',
      enum: ['gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1']
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'dark'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja']
    }
  },
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    expiresAt: Date
  },
  usage: {
    projectsCreated: {
      type: Number,
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpire;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'usage.lastActive': -1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Update lastActive on save
UserSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) {
    this.usage.lastActive = new Date();
  }
  next();
});

// Static method to hash password
UserSchema.statics.hashPassword = async function (password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Instance method to generate reset token
UserSchema.methods.generateResetToken = function (): string {
  const resetToken = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  this.resetPasswordToken = resetToken;
  this.resetPasswordExpire = new Date(Date.now() + 3600000); // 1 hour

  return resetToken;
};

export const User = mongoose.model<IUser, IUserModel>('User', UserSchema);