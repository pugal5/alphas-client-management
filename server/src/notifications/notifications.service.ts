import { prisma } from '../lib/prisma.js';
import { webSocketService } from '../websocket/websocket.service.js';
import nodemailer from 'nodemailer';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

class NotificationsService {
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize email transporter if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }
  }

  async createNotification(data: CreateNotificationData): Promise<void> {
    // Get user preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: data.userId },
    });

    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    // Emit WebSocket notification
    webSocketService.emitNotification(data.userId, notification);

    // Send email if enabled
    if (preferences?.email && this.emailTransporter) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, firstName: true },
      });

      if (user) {
        try {
          await this.emailTransporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@crm.com',
            to: user.email,
            subject: data.title,
            html: `
              <h2>${data.title}</h2>
              <p>${data.message}</p>
              ${data.link ? `<p><a href="${process.env.APP_URL}${data.link}">View Details</a></p>` : ''}
            `,
          });
        } catch (error) {
          console.error('Failed to send email notification:', error);
        }
      }
    }
  }

  async getNotifications(userId: string, limit: number = 50): Promise<any[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async updatePreferences(userId: string, preferences: {
    email?: boolean;
    inApp?: boolean;
    push?: boolean;
    taskAssigned?: boolean;
    taskDeadline?: boolean;
    taskOverdue?: boolean;
    campaignUpdate?: boolean;
    invoiceSent?: boolean;
    invoiceOverdue?: boolean;
    paymentReceived?: boolean;
  }): Promise<void> {
    await prisma.notificationPreference.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    });
  }

  async getPreferences(userId: string): Promise<any> {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  // Helper methods for common notification types
  async notifyTaskAssigned(userId: string, task: { id: string; title: string }): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (!preferences.taskAssigned) return;

    await this.createNotification({
      userId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to task: ${task.title}`,
      link: `/tasks/${task.id}`,
    });
  }

  async notifyTaskDeadline(userId: string, task: { id: string; title: string; dueDate: Date }): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (!preferences.taskDeadline) return;

    const hoursUntilDeadline = (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const message = hoursUntilDeadline < 1
      ? `Task "${task.title}" is due in less than 1 hour!`
      : `Task "${task.title}" is due in ${Math.floor(hoursUntilDeadline)} hours`;

    await this.createNotification({
      userId,
      type: 'task_deadline',
      title: 'Task Deadline Approaching',
      message,
      link: `/tasks/${task.id}`,
    });
  }

  async notifyTaskOverdue(userId: string, task: { id: string; title: string }): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (!preferences.taskOverdue) return;

    await this.createNotification({
      userId,
      type: 'task_overdue',
      title: 'Task Overdue',
      message: `Task "${task.title}" is overdue`,
      link: `/tasks/${task.id}`,
    });
  }

  async notifyCampaignUpdate(userId: string, campaign: { id: string; name: string; status: string }): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (!preferences.campaignUpdate) return;

    await this.createNotification({
      userId,
      type: 'campaign_update',
      title: 'Campaign Updated',
      message: `Campaign "${campaign.name}" status changed to ${campaign.status}`,
      link: `/campaigns/${campaign.id}`,
    });
  }

  async notifyInvoiceSent(userId: string, invoice: { id: string; invoiceNumber: string }): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (!preferences.invoiceSent) return;

    await this.createNotification({
      userId,
      type: 'invoice_sent',
      title: 'Invoice Sent',
      message: `Invoice ${invoice.invoiceNumber} has been sent`,
      link: `/invoices/${invoice.id}`,
    });
  }

  async notifyInvoiceOverdue(userId: string, invoice: { id: string; invoiceNumber: string }): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (!preferences.invoiceOverdue) return;

    await this.createNotification({
      userId,
      type: 'invoice_overdue',
      title: 'Invoice Overdue',
      message: `Invoice ${invoice.invoiceNumber} is overdue`,
      link: `/invoices/${invoice.id}`,
    });
  }

  async notifyPaymentReceived(userId: string, invoice: { id: string; invoiceNumber: string }): Promise<void> {
    const preferences = await this.getPreferences(userId);
    if (!preferences.paymentReceived) return;

    await this.createNotification({
      userId,
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment received for invoice ${invoice.invoiceNumber}`,
      link: `/invoices/${invoice.id}`,
    });
  }
}

export const notificationsService = new NotificationsService();

