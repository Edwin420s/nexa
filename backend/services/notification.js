"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
exports.getNotificationService = getNotificationService;
exports.notifyProjectStatus = notifyProjectStatus;
exports.notifySystemEvent = notifySystemEvent;
exports.sendUserWelcome = sendUserWelcome;
const events_1 = require("events");
const nodemailer_1 = __importDefault(require("nodemailer"));
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const logger_1 = __importDefault(require("../utils/logger"));
class NotificationService extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.templates = new Map();
        this.config = {
            email: {
                enabled: process.env.EMAIL_ENABLED === 'true',
                from: process.env.EMAIL_FROM || 'noreply@nexa.ai',
                transport: {
                    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                    port: parseInt(process.env.EMAIL_PORT || '587'),
                    secure: process.env.EMAIL_SECURE === 'true',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                }
            },
            webhook: {
                enabled: process.env.WEBHOOK_ENABLED === 'true',
                url: process.env.WEBHOOK_URL
            },
            inApp: {
                enabled: true,
                retentionDays: 30
            },
            sms: {
                enabled: false
            },
            ...config
        };
        this.initializeTemplates();
        this.initializeEmail();
    }
    initializeTemplates() {
        const templates = [
            {
                id: 'project_started',
                type: 'email',
                subject: 'Project {{projectName}} Started',
                body: `Hello {{userName}},

Your project "{{projectName}}" has started execution.

Project Details:
- Goal: {{projectGoal}}
- Agents: {{agentCount}}
- Expected completion: {{estimatedTime}}

You can monitor the progress at: {{projectUrl}}

Best regards,
Nexa Team`,
                variables: ['userName', 'projectName', 'projectGoal', 'agentCount', 'estimatedTime', 'projectUrl']
            },
            {
                id: 'project_completed',
                type: 'email',
                subject: 'Project {{projectName}} Completed',
                body: `Hello {{userName}},

Great news! Your project "{{projectName}}" has completed successfully.

Results:
- Confidence Score: {{confidenceScore}}%
- Execution Time: {{executionTime}}
- Files Generated: {{fileCount}}

You can view the results at: {{projectUrl}}

Best regards,
Nexa Team`,
                variables: ['userName', 'projectName', 'confidenceScore', 'executionTime', 'fileCount', 'projectUrl']
            },
            {
                id: 'project_failed',
                type: 'email',
                subject: 'Project {{projectName}} Failed',
                body: `Hello {{userName}},

We encountered an issue while executing your project "{{projectName}}".

Error: {{errorMessage}}

Our team has been notified and we're working to resolve the issue. You can try running the project again or contact support for assistance.

Project URL: {{projectUrl}}

Best regards,
Nexa Team`,
                variables: ['userName', 'projectName', 'errorMessage', 'projectUrl']
            },
            {
                id: 'agent_update',
                type: 'in_app',
                subject: 'Agent Update',
                body: 'Agent {{agentName}} has completed {{taskName}} with {{confidence}}% confidence',
                variables: ['agentName', 'taskName', 'confidence']
            },
            {
                id: 'system_alert',
                type: 'email',
                subject: 'System Alert: {{alertType}}',
                body: `System Alert

Type: {{alertType}}
Severity: {{severity}}
Message: {{message}}
Time: {{timestamp}}

Additional Details:
{{details}}

Please review the system status dashboard for more information.`,
                variables: ['alertType', 'severity', 'message', 'timestamp', 'details']
            },
            {
                id: 'welcome',
                type: 'email',
                subject: 'Welcome to Nexa!',
                body: `Welcome {{userName}}!

Thank you for joining Nexa - your autonomous research and build platform.

To get started:
1. Create your first project
2. Configure your agents
3. Monitor execution in real-time
4. Export your results

Need help? Check out our documentation or contact support.

Happy building!
The Nexa Team`,
                variables: ['userName']
            }
        ];
        templates.forEach(template => {
            this.templates.set(template.id, template);
        });
    }
    initializeEmail() {
        if (this.config.email.enabled) {
            try {
                this.emailTransporter = nodemailer_1.default.createTransport(this.config.email.transport);
                // Verify connection
                this.emailTransporter.verify((error) => {
                    if (error) {
                        logger_1.default.error('Email transporter verification failed:', error);
                        this.config.email.enabled = false;
                    }
                    else {
                        logger_1.default.info('Email transporter initialized successfully');
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Failed to initialize email transporter:', error);
                this.config.email.enabled = false;
            }
        }
    }
    async sendNotification(userId, templateId, variables, options) {
        const user = await User_1.User.findById(userId);
        if (!user) {
            throw new Error(`User ${userId} not found`);
        }
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        // Get user preferences
        const userChannels = this.getUserNotificationChannels(user);
        // Determine which channels to use
        const channels = options?.channels ||
            (options?.type ? [options.type] : userChannels);
        // Prepare notification data
        const notificationData = {
            userId,
            title: this.renderTemplate(template.subject, variables),
            message: this.renderTemplate(template.body, variables),
            data: options?.data,
            priority: options?.priority || 'medium',
            status: 'pending',
            createdAt: new Date()
        };
        const notifications = [];
        // Send through each channel
        for (const channel of channels) {
            const notification = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: channel,
                ...notificationData
            };
            try {
                await this.sendViaChannel(notification, user, variables);
                notification.status = 'sent';
                notification.sentAt = new Date();
            }
            catch (error) {
                notification.status = 'failed';
                logger_1.default.error(`Failed to send notification via ${channel}:`, error);
            }
            notifications.push(notification);
            // Emit event
            this.emit('notification:sent', notification);
        }
        return notifications;
    }
    getUserNotificationChannels(user) {
        const channels = ['in_app'];
        if (user.settings?.emailNotifications && this.config.email.enabled) {
            channels.push('email');
        }
        if (this.config.webhook.enabled && user.settings?.webhookUrl) {
            channels.push('webhook');
        }
        return channels;
    }
    async sendViaChannel(notification, user, variables) {
        switch (notification.type) {
            case 'email':
                await this.sendEmail(notification, user);
                break;
            case 'in_app':
                await this.storeInAppNotification(notification);
                break;
            case 'webhook':
                await this.sendWebhook(notification, user);
                break;
            case 'sms':
                await this.sendSms(notification, user);
                break;
            default:
                throw new Error(`Unsupported notification channel: ${notification.type}`);
        }
    }
    async sendEmail(notification, user) {
        if (!this.emailTransporter) {
            throw new Error('Email transporter not initialized');
        }
        const mailOptions = {
            from: this.config.email.from,
            to: user.email,
            subject: notification.title,
            text: notification.message,
            html: this.convertToHtml(notification.message)
        };
        await this.emailTransporter.sendMail(mailOptions);
        logger_1.default.info(`Email sent to ${user.email}: ${notification.title}`);
    }
    async storeInAppNotification(notification) {
        // Store in database or in-memory store
        // For now, just emit event
        this.emit('in_app:notification', notification);
        logger_1.default.info(`In-app notification stored: ${notification.title}`);
    }
    async sendWebhook(notification, user) {
        if (!this.config.webhook.url && !user.settings?.webhookUrl) {
            throw new Error('Webhook URL not configured');
        }
        const webhookUrl = user.settings?.webhookUrl || this.config.webhook.url;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Nexa-Signature': this.generateWebhookSignature(notification)
            },
            body: JSON.stringify({
                notification,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name
                },
                timestamp: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Webhook request failed: ${response.statusText}`);
        }
        logger_1.default.info(`Webhook sent to ${webhookUrl}: ${notification.title}`);
    }
    async sendSms(notification, user) {
        // SMS implementation would depend on the provider
        // This is a placeholder implementation
        logger_1.default.info(`SMS would be sent to ${user.phone}: ${notification.message}`);
        throw new Error('SMS notifications not implemented');
    }
    renderTemplate(template, variables) {
        let rendered = template;
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
        }
        return rendered;
    }
    convertToHtml(text) {
        // Convert plain text to basic HTML
        return text
            .split('\n\n')
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('\n');
    }
    generateWebhookSignature(notification) {
        const secret = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
        const data = JSON.stringify(notification);
        // Use HMAC for signature
        const crypto = require('crypto');
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }
    // Convenience methods for common notifications
    async notifyProjectStarted(projectId) {
        const project = await Project_1.Project.findById(projectId).populate('user');
        if (!project)
            return;
        const user = project.user;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        await this.sendNotification(user._id, 'project_started', {
            userName: user.name,
            projectName: project.title,
            projectGoal: project.goal.substring(0, 100) + '...',
            agentCount: project.agents.length,
            estimatedTime: '5-10 minutes',
            projectUrl: `${frontendUrl}/project/${project._id}`
        });
    }
    async notifyProjectCompleted(projectId) {
        const project = await Project_1.Project.findById(projectId).populate('user');
        if (!project)
            return;
        const user = project.user;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        await this.sendNotification(user._id, 'project_completed', {
            userName: user.name,
            projectName: project.title,
            confidenceScore: (project.analytics.confidenceScore * 100).toFixed(1),
            executionTime: this.formatExecutionTime(project.analytics.executionTime),
            fileCount: project.files?.length || 0,
            projectUrl: `${frontendUrl}/project/${project._id}`
        });
    }
    async notifyProjectFailed(projectId, error) {
        const project = await Project_1.Project.findById(projectId).populate('user');
        if (!project)
            return;
        const user = project.user;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        await this.sendNotification(user._id, 'project_failed', {
            userName: user.name,
            projectName: project.title,
            errorMessage: error.message.substring(0, 200),
            projectUrl: `${frontendUrl}/project/${project._id}`
        });
    }
    async notifyAgentUpdate(userId, agentName, taskName, confidence) {
        await this.sendNotification(userId, 'agent_update', {
            agentName,
            taskName,
            confidence: (confidence * 100).toFixed(1)
        }, {
            type: 'in_app',
            priority: 'low'
        });
    }
    async notifySystemAlert(alertType, severity, message, details) {
        // Send to admins
        const admins = await User_1.User.find({ role: 'admin' });
        for (const admin of admins) {
            await this.sendNotification(admin._id, 'system_alert', {
                alertType,
                severity,
                message,
                timestamp: new Date().toISOString(),
                details: JSON.stringify(details, null, 2)
            }, {
                priority: severity === 'high' ? 'high' : 'medium'
            });
        }
    }
    async sendWelcomeEmail(userId) {
        const user = await User_1.User.findById(userId);
        if (!user)
            return;
        await this.sendNotification(userId, 'welcome', {
            userName: user.name
        }, {
            type: 'email',
            priority: 'low'
        });
    }
    // Template management
    getTemplate(templateId) {
        return this.templates.get(templateId);
    }
    getTemplates() {
        return Array.from(this.templates.values());
    }
    addTemplate(template) {
        this.templates.set(template.id, template);
    }
    updateTemplate(templateId, updates) {
        const template = this.templates.get(templateId);
        if (!template)
            return false;
        this.templates.set(templateId, { ...template, ...updates });
        return true;
    }
    deleteTemplate(templateId) {
        return this.templates.delete(templateId);
    }
    // Utility methods
    formatExecutionTime(ms) {
        if (ms < 1000)
            return `${ms}ms`;
        if (ms < 60000)
            return `${(ms / 1000).toFixed(1)}s`;
        if (ms < 3600000)
            return `${(ms / 60000).toFixed(1)}m`;
        return `${(ms / 3600000).toFixed(1)}h`;
    }
    // Get user notifications
    async getUserNotifications(userId, options) {
        // In a real implementation, this would query a database
        // For now, return empty array
        return [];
    }
    async markAsRead(notificationId, userId) {
        // In a real implementation, this would update the database
        this.emit('notification:read', { notificationId, userId });
        return true;
    }
    async markAllAsRead(userId, type) {
        // In a real implementation, this would update the database
        const count = 0; // Would be actual count from DB
        this.emit('notifications:all_read', { userId, type, count });
        return count;
    }
    // Cleanup old notifications
    async cleanupOldNotifications(retentionDays) {
        const days = retentionDays || this.config.inApp.retentionDays;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        // In a real implementation, delete old notifications from database
        const deletedCount = 0; // Would be actual count from DB
        logger_1.default.info(`Cleaned up ${deletedCount} old notifications`);
        return deletedCount;
    }
}
exports.NotificationService = NotificationService;
// Singleton instance
let notificationInstance;
function getNotificationService() {
    if (!notificationInstance) {
        notificationInstance = new NotificationService();
    }
    return notificationInstance;
}
// Convenience functions for common use cases
async function notifyProjectStatus(projectId, status, error) {
    const notificationService = getNotificationService();
    switch (status) {
        case 'started':
            await notificationService.notifyProjectStarted(projectId);
            break;
        case 'completed':
            await notificationService.notifyProjectCompleted(projectId);
            break;
        case 'failed':
            await notificationService.notifyProjectFailed(projectId, error);
            break;
    }
}
async function notifySystemEvent(event, severity, message, details) {
    const notificationService = getNotificationService();
    await notificationService.notifySystemAlert(event, severity, message, details);
}
async function sendUserWelcome(userId) {
    const notificationService = getNotificationService();
    await notificationService.sendWelcomeEmail(userId);
}
