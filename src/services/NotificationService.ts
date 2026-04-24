import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { APP_CONFIG } from '../config';
import type { Notification, NotificationPriority } from '../types/Notification';

const STORAGE_KEY = 'prismboard_notifications';

export class NotificationService {
  static async getAll(userId: string): Promise<Notification[]> {
    if (APP_CONFIG.storage === 'database') {
      const q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      try {
        const all = data ? JSON.parse(data) : [];
        return all.filter((n: Notification) => n.recipientId === userId);
      } catch { return []; }
    }
  }

  // Zostawiamy dla kompatybilności wstecznej (jeśli coś jeszcze tego używa)
  static getForUser(userId: string): Notification[] {
    return [];
  }

  static async create(recipientId: string, title: string, message: string, priority: NotificationPriority): Promise<Notification> {
    const newNotification = {
      title,
      message,
      date: new Date().toISOString(),
      priority,
      isRead: false,
      recipientId
    };

    if (APP_CONFIG.storage === 'database') {
      const docRef = await addDoc(collection(db, 'notifications'), newNotification);
      return { id: docRef.id, ...newNotification };
    } else {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const withId = { id: crypto.randomUUID(), ...newNotification };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([withId, ...all]));
      return withId;
    }
  }

  static async markAsRead(id: string): Promise<void> {
    if (APP_CONFIG.storage === 'database') {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } else {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const index = all.findIndex((n: Notification) => n.id === id);
      if (index !== -1) {
        all[index].isRead = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      }
    }
  }

  static getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.isRead).length;
  }
}