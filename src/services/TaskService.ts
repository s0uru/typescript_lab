import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { APP_CONFIG } from '../config';
import type { Task } from '../types/Task';

const STORAGE_KEY = 'prismboard_tasks';

export class TaskService {
  static async getByStory(storyId: string): Promise<Task[]> {
    if (APP_CONFIG.storage === 'database') {
      const q = query(collection(db, 'tasks'), where('storyId', '==', storyId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task));
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      const all = data ? JSON.parse(data) : [];
      return all.filter((t: Task) => t.storyId === storyId);
    }
  }

  static async create(task: Omit<Task, 'id'>): Promise<Task> {
    if (APP_CONFIG.storage === 'database') {
      const docRef = await addDoc(collection(db, 'tasks'), task);
      return { id: docRef.id, ...task } as Task;
    } else {
      const allData = localStorage.getItem(STORAGE_KEY);
      const all = allData ? JSON.parse(allData) : [];
      const newTask = { id: crypto.randomUUID(), ...task };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, newTask]));
      return newTask as Task;
    }
  }

  static async update(id: string, updates: Partial<Task>): Promise<void> {
    if (APP_CONFIG.storage === 'database') {
      await updateDoc(doc(db, 'tasks', id), updates);
    } else {
      const allData = localStorage.getItem(STORAGE_KEY);
      const all = allData ? JSON.parse(allData) : [];
      const index = all.findIndex((t: Task) => t.id === id);
      if (index !== -1) {
        all[index] = { ...all[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      }
    }
  }

  static async delete(id: string): Promise<void> {
    if (APP_CONFIG.storage === 'database') {
      await deleteDoc(doc(db, 'tasks', id));
    } else {
      const allData = localStorage.getItem(STORAGE_KEY);
      let all = allData ? JSON.parse(allData) : [];
      all = all.filter((t: Task) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
  }
}