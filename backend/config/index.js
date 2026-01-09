"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const joi_1 = __importDefault(require("joi"));
// Load environment variables
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`)
});
const envVarsSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: joi_1.default.number().default(3000),
    MONGODB_URI: joi_1.default.string().required(),
    JWT_SECRET: joi_1.default.string().required(),
    GEMINI_API_KEY: joi_1.default.string().required(),
    REDIS_URL: joi_1.default.string().default('redis://localhost:6379'),
    FRONTEND_URL: joi_1.default.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().default(100),
}).unknown();
const { value: envVars, error } = envVarsSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
exports.default = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoose: {
        url: envVars.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    jwt: {
        secret: envVars.JWT_SECRET,
        expiresIn: '30d',
    },
    gemini: {
        apiKey: envVars.GEMINI_API_KEY,
    },
    redis: {
        url: envVars.REDIS_URL,
    },
    frontendUrl: envVars.FRONTEND_URL,
    rateLimit: {
        windowMs: envVars.RATE_LIMIT_WINDOW_MS,
        max: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
};
