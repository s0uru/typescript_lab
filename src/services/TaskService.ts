import type { Task } from '../types/Task';

const STORAGE_KEY = 'manageme_tasks';

export class TaskService {
  static getAll(): Task[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static getByStory(storyId: string): Task[] {
    return this.getAll().filter(t => t.storyId === storyId);
  }

  static create(taskData: Omit<Task, 'id' | 'createdAt' | 'status'>): Task {
    const tasks = this.getAll();
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'todo'
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tasks, newTask]));
    return newTask;
  }

  static update(id: string, updatedData: Partial<Task>): void {
    const tasks = this.getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updatedData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }

  static delete(id: string): void {
    const tasks = this.getAll();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.filter(t => t.id !== id)));
  }
}