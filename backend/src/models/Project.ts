import mongoose, { Document, Schema } from 'mongoose';

export interface IAgentOutput {
  timestamp: Date;
  agent: string;
  content: string;
  confidence: number;
  selfReflection?: string;
  metadata?: Record<string, any>;
}

export interface IProjectAgent {
  name: 'researcher' | 'code-builder' | 'summarizer' | 'visual-generator';
  model: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  outputs: IAgentOutput[];
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  goal: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  agents: IProjectAgent[];
  settings: {
    streaming: boolean;
    autoSave: boolean;
    confidenceThreshold: number;
    maxIterations: number;
    temperature: number;
  };
  analytics: {
    averageConfidence: number;
    totalExecutionTime: number;
    tokensUsed: number;
    iterations: number;
    successfulTasks: number;
    failedTasks: number;
  };
  files: Array<{
    name: string;
    path: string;
    type: string;
    size: number;
    content?: string;
  }>;
  state: {
    currentPhase: 'planning' | 'research' | 'synthesis' | 'build' | 'evaluation';
    currentIteration: number;
    decisions: Record<string, any>;
    taskQueue: Array<{
      taskId: string;
      description: string;
      agent: string;
      priority: 'high' | 'medium' | 'low';
      status: 'pending' | 'running' | 'completed' | 'failed';
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const ProjectSchema = new Schema<IProject>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  goal: {
    type: String,
    required: [true, 'Goal is required'],
    minlength: [10, 'Goal must be at least 10 characters'],
    maxlength: [2000, 'Goal cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'paused', 'completed', 'failed'],
    default: 'draft',
    index: true
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
      agent: String,
      content: {
        type: String,
        required: true
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      },
      selfReflection: String,
      metadata: Schema.Types.Mixed
    }],
    startedAt: Date,
    completedAt: Date,
    error: String
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
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    }
  },
  analytics: {
    averageConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    totalExecutionTime: {
      type: Number,
      default: 0,
      min: 0
    },
    tokensUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    iterations: {
      type: Number,
      default: 0,
      min: 0
    },
    successfulTasks: {
      type: Number,
      default: 0,
      min: 0
    },
    failedTasks: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  files: [{
    name: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    content: String
  }],
  state: {
    currentPhase: {
      type: String,
      enum: ['planning', 'research', 'synthesis', 'build', 'evaluation'],
      default: 'planning'
    },
    currentIteration: {
      type: Number,
      default: 0,
      min: 0
    },
    decisions: {
      type: Schema.Types.Mixed,
      default: {}
    },
    taskQueue: [{
      taskId: String,
      description: String,
      agent: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'failed'],
        default: 'pending'
      }
    }]
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
ProjectSchema.index({ user: 1, status: 1 });
ProjectSchema.index({ user: 1, createdAt: -1 });
ProjectSchema.index({ status: 1, createdAt: -1 });
ProjectSchema.index({ 'analytics.averageConfidence': -1 });
ProjectSchema.index({ 'state.currentPhase': 1 });

// Pre-save middleware to calculate average confidence
ProjectSchema.pre('save', function (next) {
  if (this.isModified('agents')) {
    let totalConfidence = 0;
    let count = 0;

    this.agents.forEach(agent => {
      agent.outputs.forEach(output => {
        totalConfidence += output.confidence;
        count++;
      });
    });

    if (count > 0) {
      this.analytics.averageConfidence = totalConfidence / count;
    }
  }
  next();
});

// Method to add agent output
ProjectSchema.methods.addAgentOutput = function (
  agentName: string,
  content: string,
  confidence: number,
  selfReflection?: string,
  metadata?: Record<string, any>
) {
  const agent = this.agents.find((a: IProjectAgent) => a.name === agentName);

  if (agent) {
    agent.outputs.push({
      timestamp: new Date(),
      agent: agentName,
      content,
      confidence,
      selfReflection,
      metadata
    });
  }

  return this.save();
};

// Method to update project status
ProjectSchema.methods.updateStatus = function (newStatus: string) {
  this.status = newStatus;

  if (newStatus === 'running' && !this.startedAt) {
    this.startedAt = new Date();
  }

  if ((newStatus === 'completed' || newStatus === 'failed') && !this.completedAt) {
    this.completedAt = new Date();

    if (this.startedAt) {
      this.analytics.totalExecutionTime =
        this.completedAt.getTime() - this.startedAt.getTime();
    }
  }

  return this.save();
};

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
