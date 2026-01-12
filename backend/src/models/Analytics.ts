import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalyticsEvent {
  projectId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  eventType: 'agent_start' | 'agent_complete' | 'agent_fail' | 'task_complete' | 'iteration';
  agentName?: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface IAnalytics extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalProjects: number;
    completedProjects: number;
    failedProjects: number;
    runningProjects: number;
    totalAgentExecutions: number;
    averageConfidence: number;
    totalTokensUsed: number;
    averageExecutionTime: number;
    successRate: number;
  };
  agentMetrics: Array<{
    agentName: string;
    executions: number;
    averageConfidence: number;
    averageResponseTime: number;
    successRate: number;
  }>;
  usage: {
    apiCalls: number;
    streamingSessions: number;
    fileGenerations: number;
  };
  events: IAnalyticsEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  period: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  metrics: {
    totalProjects: {
      type: Number,
      default: 0,
      min: 0
    },
    completedProjects: {
      type: Number,
      default: 0,
      min: 0
    },
    failedProjects: {
      type: Number,
      default: 0,
      min: 0
    },
    runningProjects: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAgentExecutions: {
      type: Number,
      default: 0,
      min: 0
    },
    averageConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    averageExecutionTime: {
      type: Number,
      default: 0,
      min: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  },
  agentMetrics: [{
    agentName: {
      type: String,
      required: true,
      enum: ['researcher', 'code-builder', 'summarizer', 'visual-generator']
    },
    executions: {
      type: Number,
      default: 0,
      min: 0
    },
    averageConfidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  }],
  usage: {
    apiCalls: {
      type: Number,
      default: 0,
      min: 0
    },
    streamingSessions: {
      type: Number,
      default: 0,
      min: 0
    },
    fileGenerations: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  events: [{
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventType: {
      type: String,
      required: true,
      enum: ['agent_start', 'agent_complete', 'agent_fail', 'task_complete', 'iteration']
    },
    agentName: String,
    data: Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
AnalyticsSchema.index({ user: 1, 'period.start': -1 });
AnalyticsSchema.index({ project: 1, createdAt: -1 });
AnalyticsSchema.index({ 'events.timestamp': -1 });

// Static method to aggregate analytics
AnalyticsSchema.statics.aggregateUserAnalytics = async function (
  userId: mongoose.Types.ObjectId,
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        user: userId,
        'period.start': { $gte: startDate },
        'period.end': { $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$user',
        totalProjects: { $sum: '$metrics.totalProjects' },
        completedProjects: { $sum: '$metrics.completedProjects' },
        failedProjects: { $sum: '$metrics.failedProjects' },
        totalTokensUsed: { $sum: '$metrics.totalTokensUsed' },
        avgConfidence: { $avg: '$metrics.averageConfidence' },
        avgExecutionTime: { $avg: '$metrics.averageExecutionTime' }
      }
    }
  ]);
};

// Method to record event
AnalyticsSchema.methods.recordEvent = function (
  projectId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  eventType: string,
  agentName?: string,
  data?: Record<string, any>
) {
  this.events.push({
    projectId,
    userId,
    eventType,
    agentName,
    data: data || {},
    timestamp: new Date()
  });

  return this.save();
};

export const Analytics = mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);