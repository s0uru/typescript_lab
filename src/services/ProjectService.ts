import type { Project } from '../types/Project';

const STORAGE_KEY = 'manageme_projects';

export class ProjectService {
  // 1. POBIERANIE (Read)
  static getAll(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // 2. DODAWANIE (Create)
  static create(name: string, description: string): Project {
    const projects = this.getAll();
    const newProject: Project = {
      id: crypto.randomUUID(), // Generuje unikalny ciąg znaków
      name,
      description
    };
    
    const updatedProjects = [...projects, newProject];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
    return newProject;
  }

  // 3. USUWANIE (Delete)
  static delete(id: string): void {
    const projects = this.getAll();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  // 4. AKTUALIZACJA (Update)
  static update(id: string, updatedData: Partial<Project>): void {
    const projects = this.getAll();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updatedData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    }
  }
}