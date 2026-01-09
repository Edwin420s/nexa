<<<<<<< D:\Projects\New folder (2)\nexa\backend\models\Project.ts
<<<<<<< D:\Projects\New folder (2)\nexa\backend\models\Project.ts
import mongoose, { Document, Schema } from 'mongoose';
=======
import mongoose, { Document, Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-ed3833f2\backend\models\Project.ts
=======
import mongoose, { Document, Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-ed3833f2\backend\models\Project.ts

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

<<<<<<< D:\Projects\New folder (2)\nexa\backend\models\Project.ts
<<<<<<< D:\Projects\New folder (2)\nexa\backend\models\Project.ts
export const Project = mongoose.model<IProject>('Project', ProjectSchema);
=======
=======
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-ed3833f2\backend\models\Project.ts
// Add indexes
ProjectSchema.index({ user: 1, status: 1 });
ProjectSchema.index({ 'agents.status': 1 });
ProjectSchema.index({ createdAt: -1 });

// Add pre-save hook to set timestamps
ProjectSchema.pre<IProject>('save', function(next) {
  const now = new Date();
  this.updatedAt = now;
  if (!this.createdAt) {
    this.createdAt = now;
  }
  next();
});

// Add method to add an agent to the project
ProjectSchema.methods.addAgent = function(agent: {
  name: string;
  model: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  outputs?: IAgentOutput[];
}) {
  this.agents.push({
    name: agent.name,
    model: agent.model,
    status: agent.status || 'idle',
    outputs: agent.outputs || []
  });
  return this.save();
};

// Add method to update agent status
ProjectSchema.methods.updateAgentStatus = function(agentName: string, status: 'idle' | 'running' | 'completed' | 'failed') {
  const agent = this.agents.find((a: any) => a.name === agentName);
  if (agent) {
    agent.status = status;
    if (status === 'completed' || status === 'failed') {
      this.completedAt = new Date();
    }
    return this.save();
  }
  throw new Error(`Agent ${agentName} not found in project ${this._id}`);
};

// Add method to add agent output
ProjectSchema.methods.addAgentOutput = function(agentName: string, output: Omit<IAgentOutput, 'timestamp'>) {
  const agent = this.agents.find((a: any) => a.name === agentName);
  if (agent) {
    agent.outputs.push({
      ...output,
      timestamp: new Date()
    });
    return this.save();
  }
  throw new Error(`Agent ${agentName} not found in project ${this._id}`);
};

// Add static method to create a new project with default settings
ProjectSchema.statics.createProject = async function(data: {
  user: string;
  title: string;
  description: string;
  goal: string;
}) {
  const project = new this({
    ...data,
    status: 'draft',
    settings: {
      streaming: true,
      autoSave: true,
      confidenceThreshold: 0.7,
      maxIterations: 10
    },
    analytics: {
      confidenceScore: 0,
      executionTime: 0,
      tokensUsed: 0,
      iterations: 0
    },
    files: []
  });
  
  return project.save();
};

// Add query helper for active projects
ProjectSchema.query.active = function() {
  return this.where({ status: { $in: ['draft', 'running', 'paused'] } });
};

// Add query helper for completed projects
ProjectSchema.query.completed = function() {
  return this.where({ status: 'completed' });
};

// Add virtual for project duration
ProjectSchema.virtual('duration').get(function(this: IProject) {
  if (!this.startedAt) return 0;
  const end = this.completedAt || new Date();
  return end.getTime() - this.startedAt.getTime();
});

// Add toJSON transform to include virtuals
ProjectSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret._id;
    return ret;
  }
});

// Add middleware to clean up related data when project is deleted
ProjectSchema.pre('remove', async function(next) {
  try {
    // Clean up any related data here
    // Example: await File.deleteMany({ project: this._id });
    next();
  } catch (error: any) {
    next(error);
  }
});

const Project = mongoose.model<IProject>('Project', ProjectSchema);

<<<<<<< D:\Projects\New folder (2)\nexa\backend\models\Project.ts
export default Project;
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-ed3833f2\backend\models\Project.ts
=======
export default Project;
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-ed3833f2\backend\models\Project.ts
