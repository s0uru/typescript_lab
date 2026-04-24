import { useState, useEffect } from 'react';
import { ProjectService } from './services/ProjectService';
import { UserService } from './services/UserService';
import { StoryService } from './services/StoryService';
import { TaskService } from './services/TaskService';
import { NotificationService } from './services/NotificationService';

import type { Project } from './types/Project';
import type { Story, StoryStatus, StoryPriority } from './types/Story';
import type { Task, TaskPriority } from './types/Task';
import type { Notification, NotificationPriority } from './types/Notification';
import type { User, UserRole } from './types/User';

function App() {
  // --- SYSTEM AUTORYZACJI I ZARZĄDZANIA ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<'board' | 'users'>('board');

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const unsubscribe = UserService.listenToAuthChanges(async (user) => {
      setCurrentUser(user);
      if (user && user.role === 'admin') {
        const users = await UserService.getAllUsers();
        setAllUsers(users);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', theme);
  }, [darkMode]);

  // --- STANY DANYCH KANBAN ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [activeDialog, setActiveDialog] = useState<Notification | null>(null);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Formularze
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [storyName, setStoryName] = useState('');
  const [storyDesc, setStoryDesc] = useState('');
  const [storyPriority, setStoryPriority] = useState<StoryPriority>('medium');
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskTime, setTaskTime] = useState<number>(1);

  const loadNotifications = async () => {
    if (currentUser) {
      const data = await NotificationService.getAll(currentUser.id);
      setNotifications(data);
    }
  };

  const sendNotification = async (recipientId: string, title: string, msg: string, priority: NotificationPriority) => {
    const note = await NotificationService.create(recipientId, title, msg, priority);
    if (currentUser && recipientId === currentUser.id) {
      loadNotifications();
      if (priority === 'medium' || priority === 'high') setActiveDialog(note);
    }
  };

  useEffect(() => {
    if (currentUser && !currentUser.isBlocked && currentUser.role !== 'guest') {
      ProjectService.getAll().then(setProjects);
      setActiveProjectId(ProjectService.getActiveId());
      loadNotifications();
      UserService.getAllUsers().then(setAllUsers);
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeProjectId) {
      StoryService.getByProject(activeProjectId).then(setStories);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (activeStoryId) {
      TaskService.getByStory(activeStoryId).then(setTasks);
    }
  }, [activeStoryId]);

  // --- OBSŁUGA PROJEKTÓW ---
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    await ProjectService.create(projName, projDesc);
    
    allUsers.filter(u => u.role === 'admin').forEach(admin => {
      sendNotification(admin.id, 'Nowy Projekt', `Utworzono projekt: ${projName}`, 'high');
    });

    setProjName(''); setProjDesc('');
    setProjects(await ProjectService.getAll());
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await ProjectService.delete(id);
    setProjects(await ProjectService.getAll());
  };

  const handleSelectProject = (id: string | null) => {
    ProjectService.setActive(id);
    setActiveProjectId(id);
    setActiveStoryId(null);
  };

  // --- OBSŁUGA HISTORYJEK ---
  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyName.trim() || !activeProjectId || !currentUser) return;
    
    await StoryService.create({ 
      name: storyName, 
      description: storyDesc, 
      priority: storyPriority, 
      projectId: activeProjectId, 
      status: 'todo', 
      ownerId: currentUser.id,
      createdAt: new Date().toISOString() // <-- POPRAWKA: Dodano pole createdAt
    });
    
    await sendNotification(currentUser.id, 'Nowa historyjka', `Pomyślnie dodano historyjkę: "${storyName}"`, 'medium');

    setStoryName(''); setStoryDesc('');
    setStories(await StoryService.getByProject(activeProjectId));
  };

  const updateStoryStatus = async (id: string, status: StoryStatus) => {
    await StoryService.update(id, { status });
    if (activeProjectId) setStories(await StoryService.getByProject(activeProjectId));
  };

  // --- OBSŁUGA ZADAŃ ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !activeStoryId) return;
    
    await TaskService.create({ 
      name: taskName, 
      description: taskDesc, 
      priority: taskPriority, 
      estimatedTime: taskTime, 
      storyId: activeStoryId, 
      status: 'todo' 
    });
    
    const story = stories.find(s => s.id === activeStoryId);
    if (story) {
      sendNotification(story.ownerId, 'Nowe zadanie', `Dodano zadanie "${taskName}" do historyjki ${story.name}`, 'medium');
    }

    setTaskName(''); setTaskDesc(''); setTaskTime(1);
    setTasks(await TaskService.getByStory(activeStoryId));
  };

  const handleAssignUser = async (taskId: string, userId: string) => {
    await TaskService.update(taskId, { assignedUserId: userId, status: 'doing', startDate: new Date().toISOString() });
    
    const story = stories.find(s => s.id === activeStoryId);
    const task = tasks.find(t => t.id === taskId);

    sendNotification(userId, 'Zostałeś przypisany', `Przypisano Cię do zadania: ${task?.name}`, 'high');
    
    if (story) {
      sendNotification(story.ownerId, 'Zadanie w toku', `Zadanie "${task?.name}" ma status DOING`, 'low');
      if (story.status === 'todo') {
        await StoryService.update(story.id, { status: 'doing' });
        setStories(await StoryService.getByProject(activeProjectId!));
      }
    }
    setTasks(await TaskService.getByStory(activeStoryId!));
    setSelectedTask(null);
  };

  const handleCompleteTask = async (taskId: string) => {
    await TaskService.update(taskId, { status: 'done', endDate: new Date().toISOString() });
    
    const story = stories.find(s => s.id === activeStoryId);
    const task = tasks.find(t => t.id === taskId);
    
    if (story) sendNotification(story.ownerId, 'Zadanie ukończone', `Zadanie "${task?.name}" ma status DONE`, 'medium');

    const updatedTasks = await TaskService.getByStory(activeStoryId!);
    setTasks(updatedTasks);
    
    if (updatedTasks.every(t => t.status === 'done')) {
      await StoryService.update(activeStoryId!, { status: 'done' });
      setStories(await StoryService.getByProject(activeProjectId!));
    }
    setSelectedTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const story = stories.find(s => s.id === activeStoryId);
    
    if (window.confirm(`Czy na pewno usunąć zadanie: ${task?.name}?`)) {
      await TaskService.delete(taskId);
      if (story) sendNotification(story.ownerId, 'Usunięto zadanie', `Zadanie "${task?.name}" zostało usunięte.`, 'medium');
      setTasks(await TaskService.getByStory(activeStoryId!));
      setSelectedTask(null);
    }
  };

  const calculateHours = (start?: string, end?: string) => {
    if (!start) return '0.00';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const hours = (endTime - startTime) / (1000 * 60 * 60);
    return Math.max(0, hours).toFixed(2);
  };

  // --- ZARZĄDZANIE UŻYTKOWNIKAMI (ADMIN) ---
  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    await UserService.updateUser(userId, { role: newRole });
    setAllUsers(await UserService.getAllUsers());
  };

  const handleToggleBlock = async (user: User) => {
    await UserService.updateUser(user.id, { isBlocked: !user.isBlocked });
    setAllUsers(await UserService.getAllUsers());
  };

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeStory = stories.find(s => s.id === activeStoryId);

  const inputClass = "w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:ring-2 ring-blue-500 outline-none transition-all dark:text-white";
  const btnClass = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/30";

  // --- WIDOKI DOSTĘPU ---
  if (authLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900 dark:text-white">Autoryzacja...</div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <h1 className="text-6xl font-black text-blue-600 mb-12 tracking-tight" style={{ fontFamily: 'Righteous, cursive' }}>PrismBoard</h1>
        <button onClick={UserService.loginWithGoogle} className={btnClass}>Zaloguj przez Google</button>
      </div>
    );
  }

  if (currentUser.isBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-center p-4">
        <div className="text-red-500 text-7xl mb-6">⛔</div>
        <h2 className="text-3xl font-bold dark:text-white">Konto zablokowane</h2>
        <p className="text-slate-500 mt-4 mb-8">Dostęp do Twojego konta został wstrzymany przez administratora.</p>
        <button onClick={UserService.logout} className="text-blue-500 hover:underline font-bold">Wyloguj</button>
      </div>
    );
  }

  if (currentUser.role === 'guest') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-center p-4">
        <div className="text-yellow-500 text-7xl mb-6">⏳</div>
        <h2 className="text-3xl font-bold dark:text-white">Oczekiwanie na zatwierdzenie</h2>
        <p className="text-slate-500 mt-4 mb-8 max-w-md">Twoje konto jest aktywne jako Gość. Poczekaj, aż administrator przypisze Ci odpowiednią rolę.</p>
        <button onClick={UserService.logout} className="text-blue-500 hover:underline font-bold">Wyloguj</button>
      </div>
    );
  }

  // --- GŁÓWNY RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 p-4 md:p-8 relative">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-6">
            <h1 onClick={() => setCurrentView('board')} className="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tight cursor-pointer" style={{ fontFamily: 'Righteous, cursive' }}>
              PrismBoard
            </h1>
            {currentUser.role === 'admin' && (
              <button onClick={() => setCurrentView('users')} className={`font-bold transition-colors ${currentView === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
                Użytkownicy
              </button>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setShowAllNotifications(true)} className="relative p-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:scale-105 transition-all text-xl">
              🔔
              {NotificationService.getUnreadCount(notifications) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {NotificationService.getUnreadCount(notifications)}
                </span>
              )}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl hover:scale-105 transition-all text-xl">
              {darkMode ? '🌙' : '☀️'}
            </button>
            <div className="text-right flex items-center gap-4">
              <div>
                <p className="font-semibold">{currentUser.firstName} {currentUser.lastName}</p>
                <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                  {currentUser.role}
                </span>
              </div>
              <button onClick={UserService.logout} className="text-sm text-red-500 hover:underline font-bold ml-2">Wyloguj</button>
            </div>
          </div>
        </header>

        {currentView === 'users' && currentUser.role === 'admin' ? (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold mb-6">Zarządzanie Użytkownikami</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="p-4">Użytkownik</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Rola</th>
                    <th className="p-4">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u.id} className={`border-b border-slate-100 dark:border-slate-700/50 ${u.isBlocked ? 'opacity-50' : ''}`}>
                      <td className="p-4 font-bold">{u.firstName} {u.lastName}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4">
                        <select value={u.role} onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole)} className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border-none text-sm outline-none cursor-pointer" disabled={u.id === currentUser.id}>
                          <option value="guest">Guest</option>
                          <option value="developer">Developer</option>
                          <option value="devops">DevOps</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <button onClick={() => handleToggleBlock(u)} disabled={u.id === currentUser.id} className={`px-4 py-2 rounded-lg text-sm font-bold text-white ${u.isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50 transition-colors`}>
                          {u.isBlocked ? 'Odblokuj' : 'Zablokuj'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : 

        !activeProjectId ? (
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
                  <div key={p.id} className="group bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all shadow-sm flex flex-col">
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
        ) : !activeStoryId ? (
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
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${story.priority === 'high' ? 'bg-red-100 text-red-600' : story.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{story.priority}</span>
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
        ) : (
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
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{task.priority}</span>
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
                    <button onClick={() => handleCompleteTask(selectedTask.id)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors mb-4 shadow-lg shadow-green-500/30">Oznacz jako ZAKOŃCZONE</button>
                  )}

                  <button onClick={() => handleDeleteTask(selectedTask.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 font-bold py-3 rounded-xl transition-colors mb-4">Usuń zadanie</button>
                  <button onClick={() => setSelectedTask(null)} className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-colors">Zamknij widok</button>
                </div>
              </div>
            )}
          </div>
        )}

        {showAllNotifications && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setShowAllNotifications(false)}>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Powiadomienia</h2>
                <button onClick={() => setShowAllNotifications(false)} className="text-slate-400 hover:text-red-500 font-bold">Zamknij</button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {notifications.length === 0 ? <p className="text-slate-500 text-center py-4">Brak powiadomień</p> : 
                  notifications.map(n => (
                    <div key={n.id} onClick={async () => { await NotificationService.markAsRead(n.id); setActiveDialog(n); loadNotifications(); }} className={`p-4 rounded-xl border cursor-pointer transition-colors ${n.isRead ? 'opacity-60 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold">{n.title}</h4>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${n.priority === 'high' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{n.priority}</span>
                      </div>
                      <p className="text-sm opacity-80">{n.message}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {activeDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl border-t-8 border-blue-600">
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-2 block">{activeDialog.priority} Priority</span>
              <h3 className="text-2xl font-bold mb-2">{activeDialog.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{activeDialog.message}</p>
              <button onClick={async () => { await NotificationService.markAsRead(activeDialog.id); setActiveDialog(null); loadNotifications(); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">Rozumiem</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;