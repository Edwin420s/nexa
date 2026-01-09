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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Agent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AgentSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
        enum: ['research', 'code', 'summary', 'visual']
    },
    model: {
        type: String,
        required: true,
        enum: ['gemini-3-pro', 'gemini-2.5-flash', 'gemini-2.5-pro', 'nano-banana', 'veo-3.1']
    },
    description: {
        type: String,
        required: true
    },
    capabilities: [{
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
exports.Agent = mongoose_1.default.model('Agent', AgentSchema);
