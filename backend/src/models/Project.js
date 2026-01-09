"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const ProjectSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
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
                    metadata: mongoose_1.Schema.Types.Mixed
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
// Add indexes
ProjectSchema.index({ user: 1, status: 1 });
ProjectSchema.index({ 'agents.status': 1 });
ProjectSchema.index({ createdAt: -1 });
// Add pre-save hook to set timestamps
ProjectSchema.pre('save', function (next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next();
});
// Add method to add an agent to the project
ProjectSchema.methods.addAgent = function (agent) {
    this.agents.push({
        name: agent.name,
        model: agent.model,
        status: agent.status || 'idle',
        outputs: agent.outputs || []
    });
    return this.save();
};
// Add method to update agent status
ProjectSchema.methods.updateAgentStatus = function (agentName, status) {
    const agent = this.agents.find((a) => a.name === agentName);
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
ProjectSchema.methods.addAgentOutput = function (agentName, output) {
    const agent = this.agents.find((a) => a.name === agentName);
    if (agent) {
        agent.outputs.push({
            ...output,
            timestamp: new Date()
        });
        return this.save();
    }
    throw new Error(`Agent ${agentName} not found in project ${this._id}`);
};
// Add method to update project analytics
ProjectSchema.methods.updateAnalytics = function (updates) {
    this.analytics = { ...this.analytics, ...updates };
    return this.save();
};
// Add static method to find projects by status
ProjectSchema.statics.findByStatus = function (status) {
    return this.find({ status });
};
// Add static method to find projects by user
ProjectSchema.statics.findByUser = function (userId) {
    return this.find({ user: userId });
};
// Add middleware to clean up related data when project is deleted
ProjectSchema.pre('remove', async function (next) {
    try {
        // Clean up any related data here
        // For example: delete associated files, tasks, etc.
        next();
    }
    catch (error) {
        logger_1.default.error(`Error cleaning up project ${this._id}:`, error);
        next(error);
    }
});
exports.Project = mongoose_1.default.model('Project', ProjectSchema);
// Add indexes
ProjectSchema.index({ user: 1, status: 1 });
ProjectSchema.index({ 'agents.status': 1 });
ProjectSchema.index({ createdAt: -1 });
// Add pre-save hook to set timestamps
ProjectSchema.pre('save', function (next) {
    const now = new Date();
    this.updatedAt = now;
    if (!this.createdAt) {
        this.createdAt = now;
    }
    next();
});
// Add method to add an agent to the project
ProjectSchema.methods.addAgent = function (agent) {
    this.agents.push({
        name: agent.name,
        model: agent.model,
        status: agent.status || 'idle',
        outputs: agent.outputs || []
    });
    return this.save();
};
// Add method to update agent status
ProjectSchema.methods.updateAgentStatus = function (agentName, status) {
    const agent = this.agents.find((a) => a.name === agentName);
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
ProjectSchema.methods.addAgentOutput = function (agentName, output) {
    const agent = this.agents.find((a) => a.name === agentName);
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
ProjectSchema.statics.createProject = async function (data) {
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
ProjectSchema.query.active = function () {
    return this.where({ status: { $in: ['draft', 'running', 'paused'] } });
};
// Add query helper for completed projects
ProjectSchema.query.completed = function () {
    return this.where({ status: 'completed' });
};
// Add virtual for project duration
ProjectSchema.virtual('duration').get(function () {
    if (!this.startedAt)
        return 0;
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
ProjectSchema.pre('remove', async function (next) {
    try {
        // Clean up any related data here
        // Example: await File.deleteMany({ project: this._id });
        next();
    }
    catch (error) {
        next(error);
    }
});
const Project = mongoose_1.default.model('Project', ProjectSchema);
exports.default = exports.Project;
