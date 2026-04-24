export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Task {
  id: string;
  name: string;
  description: string;
  priority: TaskPriority;
  estimatedTime: number; // Szacowany czas w godzinach
  storyId: string; // ID historyjki, do której przypisano zadanie
  status: TaskStatus;
  
  assignedUserId?: string;
  startDate?: string; // Data w formacie ISO string
  endDate?: string; // Data w formacie ISO string
}