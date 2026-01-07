import mongoose, { Document, Schema } from 'mongoose';

export interface IAgentOutput {
  timestamp: Date;
  agent: string;
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface IProject extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  goal: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  agents: {
    name: string;
    model: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    outputs: IAgentOutput[];
  }[];
  settings: {
    streaming: boolean;
    autoSave: boolean;
    confidenceThreshold: number;
    maxIterations: number;
  };
  analytics: {
    confidenceScore: number;
    executionTime: number;
    tokensUsed: number;
    iterations: number;
  };
  files: Array<{
    name: string;
    path: string;
    type: string;
    size: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  goal: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'failed'],
    default: 'draft'
  },
  agents: [{
    name: {
      type: String,
      required: true,
      enum: ['researcher', 'code-builder', 'summarizer', 'visual-generator']
    },
    model: {
      type: String,
      default: 'gemini-2.5-flash',
      enum: ['gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1']
    },
    status: {
      type: String,
      enum: ['idle', 'running', 'completed', 'failed'],
      default: 'idle'
    },
    outputs: [{
      timestamp: {
        type: Date,
        default: Date.now
      },
      content: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      },
      metadata: Schema.Types.Mixed
    }]
  }],
  settings: {
    streaming: {
      type: Boolean,
      default: true
    },
    autoSave: {
      type: Boolean,
      default: true
    },
    confidenceThreshold: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7
    },
    maxIterations: {
      type: Number,
      default: 10,
      min: 1,
      max: 100
    }
  },
  analytics: {
    confidenceScore: {
      type: Number,
      default: 0
    },
    executionTime: {
      type: Number,
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    iterations: {
      type: Number,
      default: 0
    }
  },
  files: [{
    name: String,
    path: String,
    type: String,
    size: Number
  }],
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for faster queries
ProjectSchema.index({ user: 1, status: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ 'analytics.confidenceScore': -1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);