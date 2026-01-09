import mongoose, { Document, Schema } from 'mongoose';

export interface IAgent extends Document {
  name: string;
  type: 'research' | 'code' | 'summary' | 'visual';
  model: string;
  description: string;
  capabilities: string[];
  config: {
    temperature: number;
    maxTokens: number;
    topP: number;
    topK: number;
  };
  prompts: {
    system: string;
    user: string;
  };
  performance: {
    avgConfidence: number;
    avgResponseTime: number;
    totalExecutions: number;
    successRate: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>({
  name: {
    type: String,
    required: true,
    type: String
  }],
  config: {
    temperature: {
      type: Number,
      min: 0,
      max: 2,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 2048
    },
    topP: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.95
    },
    topK: {
      type: Number,
      min: 1,
      max: 40,
      default: 40
    }
  },
  prompts: {
    system: {
      type: String,
      required: true
    },
    user: {
      type: String,
      required: true
    }
  },
  performance: {
    avgConfidence: {
      type: Number,
      default: 0
    },
    avgResponseTime: {
      type: Number,
      default: 0
    },
    totalExecutions: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Agent = mongoose.model<IAgent>('Agent', AgentSchema);