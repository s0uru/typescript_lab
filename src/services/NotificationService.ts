import type { Notification, NotificationPriority } from '../types/Notification';

const STORAGE_KEY = 'prismboard_notifications';

export class NotificationService {
  static getAll(): Notification[] {
    const data = localStorage.getItem(STORAGE_KEY);
    try {
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  static getForUser(userId: string): Notification[] {
    return this.getAll().filter(n => n.recipientId === userId);
  }

  static create(recipientId: string, title: string, message: string, priority: NotificationPriority): Notification {
    const notifications = this.getAll();
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      title,
      message,
      date: new Date().toISOString(),
      priority,
      isRead: false,
      recipientId
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newNotification, ...notifications]));
    return newNotification;
  }

  static markAsRead(id: string): void {
    const notifications = this.getAll();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].isRead = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    }
  }

  static getUnreadCount(userId: string): number {
    return this.getForUser(userId).filter(n => !n.isRead).length;
  }
}