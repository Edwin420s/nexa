import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  projects: mongoose.Types.ObjectId[];
  settings: {
    emailNotifications: boolean;
    defaultModel: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
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
      enum: ['gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro']
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);