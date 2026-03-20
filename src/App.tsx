import { useState, useEffect } from 'react';
import { ProjectService } from './services/ProjectService';
import { UserService } from './services/UserService';
import { StoryService } from './services/StoryService';
import { TaskService } from './services/TaskService';
import type { Project } from './types/Project';
import type { Story, StoryStatus, StoryPriority } from './types/Story';
import type { Task, TaskPriority } from './types/Task';
import './App.css';

function App() {
  const user = UserService.getLoggedInUser();
  const allUsers = UserService.getAllUsers();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  
  // Stany dla zadań (Lab 3)
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Formularz Projektu
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  // Formularz Historyjki
  const [storyName, setStoryName] = useState('');
  const [storyDesc, setStoryDesc] = useState('');
  const [storyPriority, setStoryPriority] = useState<StoryPriority>('medium');

  // Formularz Zadania
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

  // --- LOGIKA PROJEKTÓW ---
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
    setActiveStoryId(null); // Reset story level
  };

  // --- LOGIKA HISTORYJEK ---
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

  // --- LOGIKA ZADAŃ (Lab 3) ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !activeStoryId) return;
    TaskService.create({ name: taskName, description: taskDesc, priority: taskPriority, estimatedTime: taskTime, storyId: activeStoryId });
    setTaskName(''); setTaskDesc(''); setTaskTime(1);
    setTasks(TaskService.getByStory(activeStoryId));
  };

  const handleAssignUser = (taskId: string, userId: string) => {
    // 1. Przypisz osobę, zmień stan na 'doing', ustaw start
    TaskService.update(taskId, {
      assignedUserId: userId,
      status: 'doing',
      startDate: new Date().toISOString()
    });

    // 2. Jeśli historyjka to 'todo', również przechodzi na 'doing'
    const currentStory = stories.find(s => s.id === activeStoryId);
    if (currentStory && currentStory.status === 'todo') {
      StoryService.update(currentStory.id, { status: 'doing' });
      setStories(StoryService.getByProject(activeProjectId!));
    }

    setTasks(TaskService.getByStory(activeStoryId!));
    setSelectedTask(null); // Zamknij modal po akcji
  };

  const handleCompleteTask = (taskId: string) => {
    // 1. Zakończ zadanie
    TaskService.update(taskId, {
      status: 'done',
      endDate: new Date().toISOString()
    });

    const updatedTasks = TaskService.getByStory(activeStoryId!);
    setTasks(updatedTasks);

    // 2. Jeśli wszystkie zadania w historyjce są zakończone, historia na 'done'
    if (updatedTasks.every(t => t.status === 'done')) {
      StoryService.update(activeStoryId!, { status: 'done' });
      setStories(StoryService.getByProject(activeProjectId!));
    }

    setSelectedTask(null); // Zamknij modal
  };

  const calculateHours = (start?: string, end?: string) => {
    if (!start) return '0.00';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : new Date().getTime();
    const hours = (endTime - startTime) / (1000 * 60 * 60);
    return Math.max(0, hours).toFixed(2);
  };

  // Obiekty pomocnicze
  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeStory = stories.find(s => s.id === activeStoryId);

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 className="app-title" style={{ fontSize: '2.5rem', margin: 0 }}>PrismBoard</h1>
        <div className="user-info" style={{ color: 'white', textAlign: 'right' }}>
          Zalogowany: <br/><strong>{user.firstName} {user.lastName}</strong> ({user.role})
        </div>
      </header>

      {/* --- WIDOK 1: LISTA PROJEKTÓW --- */}
      {!activeProjectId ? (
        <div>
          <h2>Dodaj nowy projekt</h2>
          <form onSubmit={handleAddProject} className="form-container">
            <input placeholder="Nazwa projektu" value={projName} onChange={e => setProjName(e.target.value)} className="input-field" />
            <textarea placeholder="Opis projektu" value={projDesc} onChange={e => setProjDesc(e.target.value)} className="textarea-field" />
            <button type="submit" className="submit-btn">Utwórz projekt</button>
          </form>

          <hr className="divider" />
          <h2>Twoje Projekty</h2>
          {projects.map(p => (
            <div key={p.id} className="project-card">
              <div>
                <h3 className="project-title">{p.name}</h3>
                <p className="project-desc">{p.description}</p>
              </div>
              <div className="card-actions">
                <button onClick={() => handleSelectProject(p.id)} className="edit-btn">Otwórz</button>
                <button onClick={(e) => handleDeleteProject(e, p.id)} className="delete-btn">Usuń</button>
              </div>
            </div>
          ))}
        </div>
      ) 
      
      /* --- WIDOK 2: KANBAN HISTORYJEK W PROJEKCIE --- */
      : !activeStoryId ? (
        <div>
          <button onClick={() => handleSelectProject(null)} className="delete-btn" style={{ marginBottom: '20px' }}>
            ← Powrót do projektów
          </button>
          <div className="project-header"><h2>Projekt: {activeProject?.name}</h2></div>

          <form onSubmit={handleAddStory} className="form-container">
            <h3>Nowa historyjka</h3>
            <input placeholder="Nazwa historyjki" value={storyName} onChange={e => setStoryName(e.target.value)} className="input-field" />
            <textarea placeholder="Opis" value={storyDesc} onChange={e => setStoryDesc(e.target.value)} className="textarea-field" />
            <select value={storyPriority} onChange={e => setStoryPriority(e.target.value as StoryPriority)} className="input-field">
              <option value="low">Priorytet: Niski</option>
              <option value="medium">Priorytet: Średni</option>
              <option value="high">Priorytet: Wysoki</option>
            </select>
            <button type="submit" className="submit-btn">Dodaj historyjkę</button>
          </form>

          <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '30px' }}>
            {(['todo', 'doing', 'done'] as StoryStatus[]).map(status => (
              <div key={status} className="column" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                <h4 style={{ textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid white' }}>{status}</h4>
                {stories.filter(s => s.status === status).map(story => (
                  <div key={story.id} className="project-card" style={{ padding: '10px', marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#ffcc00' }}>{story.priority.toUpperCase()}</div>
                    <strong>{story.name}</strong>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '15px', flexWrap: 'wrap' }}>
                      <button onClick={() => setActiveStoryId(story.id)} className="edit-btn" style={{flex: '1 1 100%', marginBottom: '5px'}}>Zadania (Board)</button>
                      {status !== 'todo' && <button onClick={() => updateStoryStatus(story.id, 'todo')} className="edit-btn" style={{fontSize: '9px', flex: 1}}>Todo</button>}
                      {status !== 'doing' && <button onClick={() => updateStoryStatus(story.id, 'doing')} className="edit-btn" style={{fontSize: '9px', flex: 1}}>Doing</button>}
                      {status !== 'done' && <button onClick={() => updateStoryStatus(story.id, 'done')} className="edit-btn" style={{fontSize: '9px', flex: 1}}>Done</button>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) 
      
      /* --- WIDOK 3: KANBAN ZADAŃ W HISTORYJCE --- */
      : (
        <div>
          <button onClick={() => setActiveStoryId(null)} className="delete-btn" style={{ marginBottom: '20px' }}>
            ← Powrót do historyjek
          </button>
          <div className="project-header">
            <h2>Historyjka: {activeStory?.name}</h2>
            <p>Projekt: {activeProject?.name}</p>
          </div>

          <form onSubmit={handleAddTask} className="form-container">
            <h3>Dodaj nowe zadanie</h3>
            <input placeholder="Nazwa zadania" value={taskName} onChange={e => setTaskName(e.target.value)} className="input-field" />
            <textarea placeholder="Opis" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="textarea-field" />
            <div style={{display: 'flex', gap: '10px'}}>
              <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as TaskPriority)} className="input-field" style={{flex: 1}}>
                <option value="low">Priorytet: Niski</option>
                <option value="medium">Priorytet: Średni</option>
                <option value="high">Priorytet: Wysoki</option>
              </select>
              <input type="number" min="1" placeholder="Czas (h)" value={taskTime} onChange={e => setTaskTime(Number(e.target.value))} className="input-field time-input" style={{flex: 1}} />
            </div>
            <button type="submit" className="submit-btn">Dodaj Zadanie</button>
          </form>

          <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '30px' }}>
            {(['todo', 'doing', 'done'] as StoryStatus[]).map(status => (
              <div key={status} className="column" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                <h4 style={{ textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid white' }}>{status}</h4>
                {tasks.filter(t => t.status === status).map(task => (
                  <div key={task.id} className="project-card" style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>
                    <div style={{ fontSize: '0.7rem', color: '#0dcaf0' }}>{task.priority.toUpperCase()} | {task.estimatedTime}h</div>
                    <strong>{task.name}</strong>
                    <div style={{ fontSize: '0.8rem', marginTop: '8px', color: 'rgba(255,255,255,0.6)' }}>
                      Przypisany: {task.assignedUserId ? allUsers.find(u => u.id === task.assignedUserId)?.firstName : 'Brak'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* MODAL: SZCZEGÓŁY ZADANIA */}
          {selectedTask && (
            <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>{selectedTask.name}</h3>
                <p><strong>Opis:</strong> {selectedTask.description}</p>
                <p><strong>Przypisana historyjka:</strong> {activeStory?.name}</p>
                <p><strong>Status:</strong> {selectedTask.status.toUpperCase()}</p>
                
                <hr className="divider" style={{margin: '10px 0'}}/>
                
                <p><strong>Data utworzenia:</strong> {new Date(selectedTask.createdAt).toLocaleString()}</p>
                <p><strong>Data startu:</strong> {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleString() : 'Jeszcze nie wystartowało'}</p>
                {selectedTask.endDate && <p><strong>Data zakończenia:</strong> {new Date(selectedTask.endDate).toLocaleString()}</p>}
                
                <p>
                  <strong>Zrealizowane roboczogodziny:</strong> {calculateHours(selectedTask.startDate, selectedTask.endDate)} h / {selectedTask.estimatedTime} h
                </p>
                <p>
                  <strong>Osoba przypisana:</strong> {selectedTask.assignedUserId ? `${allUsers.find(u => u.id === selectedTask.assignedUserId)?.firstName} (${allUsers.find(u => u.id === selectedTask.assignedUserId)?.role})` : 'Brak'}
                </p>

                {/* AKCJE ZMIANY STANU */}
                <div className="assign-section">
                  {selectedTask.status === 'todo' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      <label>Wybierz kogo przypisać, aby rozpocząć:</label>
                      <select className="input-field" onChange={(e) => {
                          if (e.target.value) handleAssignUser(selectedTask.id, e.target.value);
                        }} defaultValue="">
                        <option value="" disabled>Wybierz devopsa/developera...</option>
                        {allUsers.filter(u => u.role === 'developer' || u.role === 'devops').map(u => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedTask.status === 'doing' && (
                    <button onClick={() => handleCompleteTask(selectedTask.id)} className="submit-btn" style={{width: '100%', background: '#198754'}}>
                      Oznacz jako ZAKOŃCZONE (Done)
                    </button>
                  )}

                  {selectedTask.status === 'done' && (
                    <div style={{color: '#20c997', fontWeight: 'bold', textAlign: 'center'}}>Zadanie zostało zamknięte.</div>
                  )}
                </div>

                <button onClick={() => setSelectedTask(null)} className="delete-btn" style={{marginTop: '10px'}}>Zamknij</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;