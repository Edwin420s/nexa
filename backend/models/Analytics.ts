import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalytics extends Document {
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  agent: string;
  action: string;
  metrics: {
    confidence: number;
    executionTime: number;
    tokensUsed: number;
    cost: number;
  };
  metadata: Record<string, any>;
  timestamp: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  agent: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['project_start', 'agent_execution', 'confidence_update', 'file_generated', 'project_complete']
  },
  metrics: {
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    executionTime: {
      type: Number // in milliseconds
    },
    tokensUsed: {
      type: Number
    },
    cost: {
      type: Number
    }
  },
  metadata: Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for analytics queries
AnalyticsSchema.index({ user: 1, timestamp: -1 });
AnalyticsSchema.index({ project: 1, agent: 1 });
AnalyticsSchema.index({ action: 1, timestamp: 1 });

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);