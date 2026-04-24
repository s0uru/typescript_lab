import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { APP_CONFIG } from '../config';
import type { Project } from '../types/Project';

const STORAGE_KEY = 'prismboard_projects';
const ACTIVE_KEY = 'prismboard_active_project';

export class ProjectService {
  static async getAll(): Promise<Project[]> {
    if (APP_CONFIG.storage === 'database') {
      const snapshot = await getDocs(collection(db, 'projects'));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
    } else {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    }
  }

  static getActiveId(): string | null {
    return localStorage.getItem(ACTIVE_KEY);
  }

  static setActive(id: string | null): void {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }

  static async create(name: string, description: string): Promise<Project> {
    const project = { name, description };
    if (APP_CONFIG.storage === 'database') {
      const docRef = await addDoc(collection(db, 'projects'), project);
      return { id: docRef.id, ...project };
    } else {
      const all = await this.getAll();
      const newProject = { id: crypto.randomUUID(), ...project };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...all, newProject]));
      return newProject;
    }
  }

  static async delete(id: string): Promise<void> {
    if (APP_CONFIG.storage === 'database') {
      await deleteDoc(doc(db, 'projects', id));
    } else {
      const all = await this.getAll();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(p => p.id !== id)));
    }
  }
}