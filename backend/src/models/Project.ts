import { Document, Schema, model } from 'mongoose';
import { IUser } from './User';
import logger from '../utils/logger';

export interface IProject extends Document {
  name: string;
  description: string;
  goal: string;
  status: 'planning' | 'in_progress' | 'paused' | 'completed' | 'failed';
  createdBy: IUser['_id'];
  team: IUser['_id'][];
  agents: Array<{
    name: string;
    role: string;
    model: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    lastRun?: Date;
    config: Record<string, any>;
  }>;
  settings: {
    visibility: 'private' | 'team' | 'public';
    allowFeedback: boolean;
    notifications: {
      email: boolean;
      inApp: boolean;
    };
  };
  progress: {
    currentStep: number;
    totalSteps: number;
    percentage: number;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
  };
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    goal: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['planning', 'in_progress', 'paused', 'completed', 'failed'],
      default: 'planning',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    agents: [{
      name: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        required: true,
      },
      model: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['idle', 'running', 'completed', 'failed'],
        default: 'idle',
      },
      lastRun: {
        type: Date,
      },
      config: {
        type: Schema.Types.Mixed,
        default: {},
      },
    }],
    settings: {
      visibility: {
        type: String,
        enum: ['private', 'team', 'public'],
        default: 'private',
      },
      allowFeedback: {
        type: Boolean,
        default: true,
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        inApp: {
          type: Boolean,
          default: true,
        },
      },
    },
    progress: {
      currentStep: {
        type: Number,
        default: 0,
      },
      totalSteps: {
        type: Number,
        default: 1,
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    metadata: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      completedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function (next) {
  this.metadata.updatedAt = new Date();
  next();
});

// Add indexes
projectSchema.index({ name: 'text', description: 'text', goal: 'text' });
projectSchema.index({ createdBy: 1, status: 1 });
projectSchema.index({ 'metadata.createdAt': -1 });

export const Project = model<IProject>('Project', projectSchema);