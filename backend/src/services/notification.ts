import { EventEmitter } from 'events';
import nodemailer from 'nodemailer';
import { User } from '../models/User';
import { Project } from '../models/Project';
import logger from '../utils/logger';

export interface Notification {
  id: string;
  type: 'email' | 'in_app' | 'webhook' | 'sms';
  userId: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'sent' | 'failed' | 'read';
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface NotificationConfig {
  email: {
    enabled: boolean;
    from: string;
    transport: any;
  };
  webhook: {
    enabled: boolean;
    url?: string;
  };
  inApp: {
    enabled: boolean;
    retentionDays: number;
  };
  sms: {
    enabled: boolean;
    provider?: string;
  };
}

export class NotificationService extends EventEmitter {
  private config: NotificationConfig;
  private emailTransporter?: nodemailer.Transporter;
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor(config?: Partial<NotificationConfig>) {
    super();

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

  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
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

  private initializeEmail(): void {
    if (this.config.email.enabled) {
      try {
        this.emailTransporter = nodemailer.createTransport(this.config.email.transport);

        // Verify connection
        this.emailTransporter.verify((error) => {
          if (error) {
            logger.error('Email transporter verification failed:', error);
            this.config.email.enabled = false;
          } else {
            logger.info('Email transporter initialized successfully');
          }
        });
      } catch (error) {
        logger.error('Failed to initialize email transporter:', error);
        this.config.email.enabled = false;
      }
    }
  }

  async sendNotification(
    userId: string,
    templateId: string,
    variables: Record<string, any>,
    options?: {
      type?: Notification['type'];
      priority?: Notification['priority'];
      channels?: Notification['type'][];
      data?: Record<string, any>;
    }
  ): Promise<Notification[]> {
    const user = await User.findById(userId);
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
    const notificationData: Partial<Notification> = {
      userId,
      title: this.renderTemplate(template.subject, variables),
      message: this.renderTemplate(template.body, variables),
      data: options?.data,
      priority: options?.priority || 'medium',
      status: 'pending',
      createdAt: new Date()
    };

    const notifications: Notification[] = [];

    // Send through each channel
    for (const channel of channels) {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: channel,
        ...notificationData
      } as Notification;

      try {
        await this.sendViaChannel(notification, user, variables);
        notification.status = 'sent';
        notification.sentAt = new Date();
      } catch (error) {
        notification.status = 'failed';
        logger.error(`Failed to send notification via ${channel}:`, error);
      }

      notifications.push(notification);

      // Emit event
      this.emit('notification:sent', notification);
    }

    return notifications;
  }

  private getUserNotificationChannels(user: any): Notification['type'][] {
    const channels: Notification['type'][] = ['in_app'];

    if (user.settings?.emailNotifications && this.config.email.enabled) {
      channels.push('email');
    }

    if (this.config.webhook.enabled && user.settings?.webhookUrl) {
      channels.push('webhook');
    }

    return channels;
  }

  private async sendViaChannel(
    notification: Notification,
    user: any,
    variables: Record<string, any>
  ): Promise<void> {
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

  private async sendEmail(notification: Notification, user: any): Promise<void> {
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
    logger.info(`Email sent to ${user.email}: ${notification.title}`);
  }

  private async storeInAppNotification(notification: Notification): Promise<void> {
    // Store in database or in-memory store
    // For now, just emit event
    this.emit('in_app:notification', notification);
    logger.info(`In-app notification stored: ${notification.title}`);
  }

  private async sendWebhook(notification: Notification, user: any): Promise<void> {
    if (!this.config.webhook.url && !user.settings?.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const webhookUrl = user.settings?.webhookUrl || this.config.webhook.url;

    const response = await fetch(webhookUrl!, {
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

    logger.info(`Webhook sent to ${webhookUrl}: ${notification.title}`);
  }

  private async sendSms(notification: Notification, user: any): Promise<void> {
    // SMS implementation would depend on the provider
    // This is a placeholder implementation
    logger.info(`SMS would be sent to ${user.phone}: ${notification.message}`);
    throw new Error('SMS notifications not implemented');
  }

  async notifyProjectStarted(projectId: string): Promise<void> {
    const project = await Project.findById(projectId).populate('user');
    if (!project) return;

    const user = project.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await this.sendNotification(user._id.toString(), 'project_started', {
      userName: user.name,
      projectName: project.title,
      projectGoal: project.goal.substring(0, 100) + '...',
      agentCount: project.agents.length,
      estimatedTime: '5-10 minutes',
      projectUrl: `${frontendUrl}/project/${project._id}`
    });
  }

  async notifyProjectCompleted(projectId: string): Promise<void> {
    const project = await Project.findById(projectId).populate('user');
    if (!project) return;

    const user = project.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await this.sendNotification(user._id.toString(), 'project_completed', {
      userName: user.name,
      projectName: project.title,
      confidenceScore: (project.analytics.confidenceScore * 100).toFixed(1),
      executionTime: this.formatExecutionTime(project.analytics.executionTime),
      fileCount: project.files?.length || 0,
      projectUrl: `${frontendUrl}/project/${project._id}`
    });
  }

  async notifyProjectFailed(projectId: string, error: Error): Promise<void> {
    const project = await Project.findById(projectId).populate('user');
    if (!project) return;

    const user = project.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await this.sendNotification(user._id.toString(), 'project_failed', {
      userName: user.name,
      projectName: project.title,
      errorMessage: error.message.substring(0, 200),
      projectUrl: `${frontendUrl}/project/${project._id}`
    });
  }

  async notifyAgentUpdate(
    userId: string,
    agentName: string,
    taskName: string,
    confidence: number
  ): Promise<void> {
    await this.sendNotification(userId, 'agent_update', {
      agentName,
      taskName,
      confidence: (confidence * 100).toFixed(1)
    }, {
      type: 'in_app',
      priority: 'low'
    });
  }

  async notifySystemAlert(
    alertType: string,
    severity: 'low' | 'medium' | 'high',
    message: string,
    details?: any
  ): Promise<void> {
    // Send to admins
    const admins = await User.find({ role: 'admin' });

    for (const admin of admins) {
      await this.sendNotification(admin._id.toString(), 'system_alert', {
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

  async sendWelcomeEmail(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) return;

    await this.sendNotification(userId, 'welcome', {
      userName: user.name
    }, {
      type: 'email',
      priority: 'low'
    });
  }

  // Template management
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    this.templates.set(templateId, { ...template, ...updates });
    return true;
  }

  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  // Utility methods
  private formatExecutionTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  // Get user notifications
  async getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: Notification['type'];
    }
  ): Promise<Notification[]> {
    // In a real implementation, this would query a database
    // For now, return empty array
    return [];
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    // In a real implementation, this would update the database
    this.emit('notification:read', { notificationId, userId });
    return true;
  }

  async markAllAsRead(userId: string, type?: Notification['type']): Promise<number> {
    // In a real implementation, this would update the database
    const count = 0; // Would be actual count from DB
    this.emit('notifications:all_read', { userId, type, count });
    return count;
  }

  // Cleanup old notifications
  async cleanupOldNotifications(retentionDays?: number): Promise<number> {
    const days = retentionDays || this.config.inApp.retentionDays;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // In a real implementation, delete old notifications from database
    const deletedCount = 0; // Would be actual count from DB

    logger.info(`Cleaned up ${deletedCount} old notifications`);
    return deletedCount;
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    }

    return rendered;
  }

  private convertToHtml(text: string): string {
    // Convert plain text to basic HTML
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('\n');
  }

  private generateWebhookSignature(notification: Notification): string {
    const secret = process.env.WEBHOOK_SECRET || 'your-webhook-secret';
    const data = JSON.stringify(notification);

    // Use HMAC for signature
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }
}

// Singleton instance
let notificationInstance: NotificationService;

export function getNotificationService(): NotificationService {
  if (!notificationInstance) {
    notificationInstance = new NotificationService();
  }
  return notificationInstance;
}

// Convenience functions for common use cases
export async function notifyProjectStatus(
  projectId: string,
  status: 'started' | 'completed' | 'failed',
  error?: Error
): Promise<void> {
  const notificationService = getNotificationService();

  switch (status) {
    case 'started':
      await notificationService.notifyProjectStarted(projectId);
      break;
    case 'completed':
      await notificationService.notifyProjectCompleted(projectId);
      break;
    case 'failed':
      await notificationService.notifyProjectFailed(projectId, error!);
      break;
  }
}

export async function notifySystemEvent(
  event: string,
  severity: 'low' | 'medium' | 'high',
  message: string,
  details?: any
): Promise<void> {
  const notificationService = getNotificationService();
  await notificationService.notifySystemAlert(event, severity, message, details);
}

export async function sendUserWelcome(userId: string): Promise<void> {
  const notificationService = getNotificationService();
  await notificationService.sendWelcomeEmail(userId);
}