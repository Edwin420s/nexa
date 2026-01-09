"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Project_1 = require("../models/Project");
const orchestrator_1 = require("../agent-orchestrator/orchestrator");
const auth_1 = require("../middleware/auth");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// Get all projects for user
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const projects = await Project_1.Project.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select('-agents.outputs');
        res.json({
            success: true,
            data: projects,
            count: projects.length
        });
    }
    catch (error) {
        next(error);
    }
});
// Get single project
router.get('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const project = await Project_1.Project.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        next(error);
    }
});
// Create new project
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { title, description, goal, agents, settings } = req.body;
        if (!title || !goal) {
            return res.status(400).json({
                success: false,
                message: 'Title and goal are required'
            });
        }
        const project = await Project_1.Project.create({
            user: req.user.id,
            title,
            description: description || '',
            goal,
            agents: agents || [
                { name: 'researcher', model: 'gemini-3-pro' },
                { name: 'code-builder', model: 'gemini-2.5-pro' },
                { name: 'summarizer', model: 'gemini-2.5-flash' }
            ],
            settings: {
                streaming: true,
                autoSave: true,
                confidenceThreshold: 0.7,
                maxIterations: 10,
                ...settings
            }
        });
        logger_1.default.info(`Project created: ${project._id} by user ${req.user.id}`);
        res.status(201).json({
            success: true,
            data: project
        });
    }
    catch (error) {
        next(error);
    }
});
// Update project
router.put('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const updates = req.body;
        delete updates._id;
        delete updates.user;
        delete updates.createdAt;
        const project = await Project_1.Project.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { $set: updates }, { new: true, runValidators: true });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            data: project
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete project
router.delete('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const project = await Project_1.Project.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        logger_1.default.info(`Project deleted: ${req.params.id} by user ${req.user.id}`);
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// Execute project
router.post('/:id/run', auth_1.authenticate, async (req, res, next) => {
    try {
        const project = await Project_1.Project.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        // Check if project is already running
        const orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
        if (orchestrator.isProjectActive(project._id.toString())) {
            return res.status(400).json({
                success: false,
                message: 'Project is already running'
            });
        }
        // Start execution in background
        orchestrator.executeProject(project._id.toString()).catch(error => {
            logger_1.default.error(`Background execution error for project ${project._id}:`, error);
        });
        res.json({
            success: true,
            message: 'Project execution started',
            projectId: project._id
        });
    }
    catch (error) {
        next(error);
    }
});
// Pause project
router.post('/:id/pause', auth_1.authenticate, async (req, res, next) => {
    try {
        const orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
        if (!orchestrator.isProjectActive(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Project is not running'
            });
        }
        await orchestrator.pauseProject(req.params.id);
        res.json({
            success: true,
            message: 'Project paused'
        });
    }
    catch (error) {
        next(error);
    }
});
// Resume project
router.post('/:id/resume', auth_1.authenticate, async (req, res, next) => {
    try {
        const orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
        if (orchestrator.isProjectActive(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Project is already running'
            });
        }
        await orchestrator.resumeProject(req.params.id);
        res.json({
            success: true,
            message: 'Project resumed'
        });
    }
    catch (error) {
        next(error);
    }
});
// Cancel project execution
router.post('/:id/cancel', auth_1.authenticate, async (req, res, next) => {
    try {
        const orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
        await orchestrator.cancelProject(req.params.id);
        res.json({
            success: true,
            message: 'Project execution cancelled'
        });
    }
    catch (error) {
        next(error);
    }
});
// Get project files
router.get('/:id/files', auth_1.authenticate, async (req, res, next) => {
    try {
        const project = await Project_1.Project.findOne({
            _id: req.params.id,
            user: req.user.id
        }).select('files');
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            data: project.files
        });
    }
    catch (error) {
        next(error);
    }
});
// Get project status
router.get('/:id/status', auth_1.authenticate, async (req, res, next) => {
    try {
        const project = await Project_1.Project.findOne({
            _id: req.params.id,
            user: req.user.id
        }).select('status agents.status analytics');
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        const orchestrator = (0, orchestrator_1.getAgentOrchestrator)();
        const isActive = orchestrator.isProjectActive(req.params.id);
        res.json({
            success: true,
            data: {
                ...project.toObject(),
                isActive
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
