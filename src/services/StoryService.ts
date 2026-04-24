import { db } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { APP_CONFIG } from '../config';
import type { Story } from '../types/Story';

const STORAGE_KEY = 'prismboard_stories';

export class StoryService {
  static async getByProject(projectId: string): Promise<Story[]> {
    if (APP_CONFIG.storage === 'database') {
      const q = query(collection(db, 'stories'), where('projectId', '==', projectId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Story));
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      const all = data ? JSON.parse(data) : [];
      return all.filter((s: Story) => s.projectId === projectId);
    }
  }

  static async create(story: Omit<Story, 'id'>): Promise<Story> {
    if (APP_CONFIG.storage === 'database') {
      const docRef = await addDoc(collection(db, 'stories'), story);
      return { id: docRef.id, ...story } as Story;
    } else {
      const allData = localStorage.getItem(STORAGE_KEY);
      const all = allData ? JSON.parse(allData) : [];
      const newStory = { id: crypto.randomUUID(), ...story };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, newStory]));
      return newStory as Story;
    }
  }

  static async update(id: string, updates: Partial<Story>): Promise<void> {
    if (APP_CONFIG.storage === 'database') {
      await updateDoc(doc(db, 'stories', id), updates);
    } else {
      const allData = localStorage.getItem(STORAGE_KEY);
      const all = allData ? JSON.parse(allData) : [];
      const index = all.findIndex((s: Story) => s.id === id);
      if (index !== -1) {
        all[index] = { ...all[index], ...updates };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      }
    }
  }
}