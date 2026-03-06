import type { Project } from '../types/Project';

const STORAGE_KEY = 'manageme_projects';
const ACTIVE_KEY = 'manageme_active_project';

export class ProjectService {
  static getAll(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getActiveId(): string | null {
    return localStorage.getItem(ACTIVE_KEY);
  }

  static setActive(id: string | null): void {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }

  static create(name: string, description: string): Project {
    const projects = this.getAll();
    const newProject: Project = { id: crypto.randomUUID(), name, description };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...projects, newProject]));
    return newProject;
  }

  static delete(id: string): void {
    const projects = this.getAll();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects.filter(p => p.id !== id)));
    if (this.getActiveId() === id) this.setActive(null);
  }
}