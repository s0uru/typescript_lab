import type { Story } from '../types/Story';

const STORAGE_KEY = 'manageme_stories';

export class StoryService {
  static getAll(): Story[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Metoda, której szuka App.tsx w useEffect
  static getByProject(projectId: string): Story[] {
    return this.getAll().filter(s => s.projectId === projectId);
  }

  // Metoda create przyjmująca obiekt (tak jak w handleAddStory)
  static create(storyData: Omit<Story, 'id' | 'createdAt'>): Story {
    const stories = this.getAll();
    const newStory: Story = {
      ...storyData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...stories, newStory]));
    return newStory;
  }

  // Metoda update (używana w updateStoryStatus)
  static update(id: string, updatedData: Partial<Story>): void {
    const stories = this.getAll();
    const index = stories.findIndex(s => s.id === id);
    if (index !== -1) {
      stories[index] = { ...stories[index], ...updatedData };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stories));
    }
  }

  static delete(id: string): void {
    const stories = this.getAll();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stories.filter(s => s.id !== id)));
  }
}