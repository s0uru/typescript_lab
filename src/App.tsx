import { useState, useEffect } from 'react';
import { ProjectService } from './services/ProjectService';
import { UserService } from './services/UserService';
import { StoryService } from './services/StoryService';
import { TaskService } from './services/TaskService';
import type { Project } from './types/Project';
import type { Story, StoryStatus, StoryPriority } from './types/Story';
import type { Task, TaskPriority } from './types/Task';

function App() {
  const user = UserService.getLoggedInUser();
  const allUsers = UserService.getAllUsers();
  
  // Przełącznik Dark Mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Stany aplikacji
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  const [storyName, setStoryName] = useState('');
  const [storyDesc, setStoryDesc] = useState('');
  const [storyPriority, setStoryPriority] = useState<StoryPriority>('medium');

  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskTime, setTaskTime] = useState<number>(1);

  useEffect(() => {
    setProjects(ProjectService.getAll());
    setActiveProjectId(ProjectService.getActiveId());
  }, []);

  useEffect(() => {
    if (activeProjectId) setStories(StoryService.getByProject(activeProjectId));
  }, [activeProjectId]);

  useEffect(() => {
    if (activeStoryId) setTasks(TaskService.getByStory(activeStoryId));
  }, [activeStoryId]);

  // Logika
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    ProjectService.create(projName, projDesc);
    setProjName(''); setProjDesc('');
    setProjects(ProjectService.getAll());
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    ProjectService.delete(id);
    setProjects(ProjectService.getAll());
  };

  const handleSelectProject = (id: string | null) => {
    ProjectService.setActive(id);
    setActiveProjectId(id);
    setActiveStoryId(null);
  };

  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyName.trim() || !activeProjectId) return;
    StoryService.create({ name: storyName, description: storyDesc, priority: storyPriority, projectId: activeProjectId, status: 'todo', ownerId: user.id });
    setStoryName(''); setStoryDesc('');
    setStories(StoryService.getByProject(activeProjectId));
  };

  const updateStoryStatus = (id: string, status: StoryStatus) => {
    StoryService.update(id, { status });
    if (activeProjectId) setStories(StoryService.getByProject(activeProjectId));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !activeStoryId) return;
    TaskService.create({ name: taskName, description: taskDesc, priority: taskPriority, estimatedTime: taskTime, storyId: activeStoryId });
    setTaskName(''); setTaskDesc(''); setTaskTime(1);
    setTasks(TaskService.getByStory(activeStoryId));
  };

  const handleAssignUser = (taskId: string, userId: string) => {
    TaskService.update(taskId, {
      assignedUserId: userId,
      status: 'doing',
      startDate: new Date().toISOString()
    });
    const currentStory = stories.find(s => s.id === activeStoryId);
    if (currentStory && currentStory.status === 'todo') {
      StoryService.update(currentStory.id, { status: 'doing' });
      setStories(StoryService.getByProject(activeProjectId!));
    }
    setTasks(TaskService.getByStory(activeStoryId!));
    setSelectedTask(null);
  };

  const handleCompleteTask = (taskId: string) => {
    TaskService.update(taskId, {
      status: 'done',
      endDate: new Date().toISOString()
    });
    const updatedTasks = TaskService.getByStory(activeStoryId!);
    setTasks(updatedTasks);
    if (updatedTasks.every(t => t.status === 'done')) {
      StoryService.update(activeStoryId!, { status: 'done' });
      setStories(StoryService.getByProject(activeProjectId!));
    }
    setSelectedTask(null);
  };

  const calculateHours = (start?: string, end?: string) => {
    if (!start) return '0.00';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const hours = (endTime - startTime) / (1000 * 60 * 60);
    return Math.max(0, hours).toFixed(2);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeStory = stories.find(s => s.id === activeStoryId);

  // Style wielokrotnego użytku (zamiast klas CSS)
  const inputClass = "w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 ring-blue-500 outline-none transition-all dark:text-white";
  const btnClass = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight" style={{ fontFamily: 'Righteous, cursive' }}>
              PrismBoard
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:scale-105 transition-all text-xl"
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Zalogowany</p>
              <p className="font-semibold">{user.firstName} {user.lastName}</p>
              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                {user.role}
              </span>
            </div>
          </div>
        </header>

        {/* WIDOK 1: LISTA PROJEKTÓW */}
        {!activeProjectId ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-4">Nowy Projekt</h2>
                <form onSubmit={handleAddProject} className="space-y-4">
                  <input placeholder="Nazwa projektu" value={projName} onChange={e => setProjName(e.target.value)} className={inputClass} />
                  <textarea placeholder="Opis projektu" value={projDesc} onChange={e => setProjDesc(e.target.value)} className={`${inputClass} min-h-[100px]`} />
                  <button type="submit" className={`w-full ${btnClass}`}>Utwórz projekt</button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Twoje Projekty</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div key={p.id} className="group bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-sm">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 mb-6 line-clamp-2">{p.description}</p>
                    <div className="flex justify-between items-center mt-auto">
                      <button onClick={(e) => handleDeleteProject(e, p.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1 rounded-lg transition-colors text-sm font-bold">Usuń</button>
                      <button onClick={() => handleSelectProject(p.id)} className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">Otwórz →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) 
        
        /* WIDOK 2: KANBAN HISTORYJEK W PROJEKCIE */
        : !activeStoryId ? (
          <div className="animate-fade-in">
            <button onClick={() => handleSelectProject(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition-colors">
              ← Powrót do projektów
            </button>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl text-white mb-8 shadow-xl">
              <h2 className="text-3xl font-bold">Projekt: {activeProject?.name}</h2>
              <p className="opacity-80 mt-2">{activeProject?.description}</p>
            </div>

            <form onSubmit={handleAddStory} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
              <input placeholder="Nazwa historyjki" value={storyName} onChange={e => setStoryName(e.target.value)} className={inputClass} />
              <input placeholder="Opis" value={storyDesc} onChange={e => setStoryDesc(e.target.value)} className={inputClass} />
              <select value={storyPriority} onChange={e => setStoryPriority(e.target.value as StoryPriority)} className={inputClass}>
                <option value="low">Niski</option><option value="medium">Średni</option><option value="high">Wysoki</option>
              </select>
              <button type="submit" className={`${btnClass} whitespace-nowrap`}>Dodaj historyjkę</button>
            </form>

            <div className="grid md:grid-cols-3 gap-6">
              {(['todo', 'doing', 'done'] as StoryStatus[]).map(status => (
                <div key={status} className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-center font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{status}</h4>
                  <div className="space-y-3">
                    {stories.filter(s => s.status === status).map(story => (
                      <div key={story.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${story.priority === 'high' ? 'bg-red-100 text-red-600' : story.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                          {story.priority}
                        </span>
                        <h5 className="font-bold mt-2 text-lg">{story.name}</h5>
                        
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                          <button onClick={() => setActiveStoryId(story.id)} className="flex-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold py-2 rounded-lg hover:bg-blue-100 transition-colors">Zadania</button>
                          {status !== 'todo' && <button onClick={() => updateStoryStatus(story.id, 'todo')} className="flex-1 bg-slate-100 dark:bg-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Todo</button>}
                          {status !== 'doing' && <button onClick={() => updateStoryStatus(story.id, 'doing')} className="flex-1 bg-slate-100 dark:bg-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Doing</button>}
                          {status !== 'done' && <button onClick={() => updateStoryStatus(story.id, 'done')} className="flex-1 bg-slate-100 dark:bg-slate-700 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Done</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) 
        
        /* WIDOK 3: KANBAN ZADAŃ W HISTORYJCE */
        : (
          <div className="animate-fade-in">
            <button onClick={() => setActiveStoryId(null)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold transition-colors">
              ← Powrót do historyjek
            </button>
            <div className="bg-slate-800 text-white p-8 rounded-3xl mb-8 shadow-xl">
              <p className="text-blue-400 text-sm font-bold tracking-widest uppercase mb-1">{activeProject?.name}</p>
              <h2 className="text-3xl font-bold">Historyjka: {activeStory?.name}</h2>
            </div>

            <form onSubmit={handleAddTask} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-start">
              <input placeholder="Nazwa zadania" value={taskName} onChange={e => setTaskName(e.target.value)} className={inputClass} />
              <input placeholder="Opis" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className={inputClass} />
              <div className="flex gap-2 w-full md:w-auto">
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as TaskPriority)} className={inputClass}>
                  <option value="low">Niski</option><option value="medium">Średni</option><option value="high">Wysoki</option>
                </select>
                <input type="number" min="1" placeholder="Czas (h)" value={taskTime} onChange={e => setTaskTime(Number(e.target.value))} className={`${inputClass} w-24`} />
              </div>
              <button type="submit" className={`${btnClass} whitespace-nowrap`}>Dodaj Zadanie</button>
            </form>

            <div className="grid md:grid-cols-3 gap-6">
              {(['todo', 'doing', 'done'] as StoryStatus[]).map(status => (
                <div key={status} className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-center font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">{status}</h4>
                  <div className="space-y-3">
                    {tasks.filter(t => t.status === status).map(task => (
                      <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">{task.estimatedTime}h</span>
                        </div>
                        <strong className="block text-lg mb-2">{task.name}</strong>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                          Przypisany: <span className="font-bold">{task.assignedUserId ? allUsers.find(u => u.id === task.assignedUserId)?.firstName : 'Brak'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* MODAL: SZCZEGÓŁY ZADANIA */}
            {selectedTask && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setSelectedTask(null)}>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-2xl font-bold mb-2">{selectedTask.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">{selectedTask.description}</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 text-sm mb-6">
                    <p><strong className="text-slate-700 dark:text-slate-300">Status:</strong> <span className="uppercase">{selectedTask.status}</span></p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Start:</strong> {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleString() : 'Brak'}</p>
                    {selectedTask.endDate && <p><strong className="text-slate-700 dark:text-slate-300">Koniec:</strong> {new Date(selectedTask.endDate).toLocaleString()}</p>}
                    <p><strong className="text-slate-700 dark:text-slate-300">Czas:</strong> {calculateHours(selectedTask.startDate, selectedTask.endDate)}h z {selectedTask.estimatedTime}h</p>
                    <p><strong className="text-slate-700 dark:text-slate-300">Osoba:</strong> {selectedTask.assignedUserId ? `${allUsers.find(u => u.id === selectedTask.assignedUserId)?.firstName} (${allUsers.find(u => u.id === selectedTask.assignedUserId)?.role})` : 'Nieprzypisane'}</p>
                  </div>

                  {selectedTask.status === 'todo' && (
                    <div className="space-y-3 mb-6">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Przypisz do pracownika, aby rozpocząć:</label>
                      <select className={inputClass} onChange={(e) => { if (e.target.value) handleAssignUser(selectedTask.id, e.target.value); }} defaultValue="">
                        <option value="" disabled>Wybierz devopsa/developera...</option>
                        {allUsers.filter(u => u.role === 'developer' || u.role === 'devops').map(u => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedTask.status === 'doing' && (
                    <button onClick={() => handleCompleteTask(selectedTask.id)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors mb-6 shadow-lg shadow-green-500/30">
                      Oznacz jako ZAKOŃCZONE
                    </button>
                  )}

                  <button onClick={() => setSelectedTask(null)} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-colors">
                    Zamknij
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;