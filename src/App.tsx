import { useState, useEffect } from 'react';
import { ProjectService } from './services/ProjectService';
import { UserService } from './services/UserService';
import { StoryService } from './services/StoryService';
import type { Project } from './types/Project';
import type { Story, StoryStatus, StoryPriority } from './types/Story';
import './App.css';

function App() {
  const user = UserService.getLoggedInUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);

  // Stan dla formularza PROJEKTU (Lab 1)
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');

  // Stan dla formularza HISTORYJKI (Lab 2)
  const [storyName, setStoryName] = useState('');
  const [storyDesc, setStoryDesc] = useState('');
  const [storyPriority, setStoryPriority] = useState<StoryPriority>('medium');

  useEffect(() => {
    setProjects(ProjectService.getAll());
    setActiveProjectId(ProjectService.getActiveId());
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      setStories(StoryService.getByProject(activeProjectId));
    }
  }, [activeProjectId]);

  // --- LOGIKA PROJEKTÓW (Lab 1) ---
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim()) return;
    ProjectService.create(projName, projDesc);
    setProjName(''); setProjDesc('');
    setProjects(ProjectService.getAll());
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Zapobiega otwarciu projektu przy kliknięciu w Usuń
    ProjectService.delete(id);
    setProjects(ProjectService.getAll());
  };

  const handleSelectProject = (id: string | null) => {
    ProjectService.setActive(id);
    setActiveProjectId(id);
  };

  // --- LOGIKA HISTORYJEK (Lab 2) ---
  const handleAddStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyName.trim() || !activeProjectId) return;

    StoryService.create({
      name: storyName,
      description: storyDesc,
      priority: storyPriority,
      projectId: activeProjectId,
      status: 'todo',
      ownerId: user.id
    });

    setStoryName(''); setStoryDesc('');
    setStories(StoryService.getByProject(activeProjectId));
  };

  const updateStoryStatus = (id: string, status: StoryStatus) => {
    StoryService.update(id, { status });
    if (activeProjectId) setStories(StoryService.getByProject(activeProjectId));
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 className="app-title" style={{ fontSize: '2.5rem', margin: 0 }}>PrismBoard</h1>
        <div className="user-info" style={{ color: 'white' }}>
          Zalogowany: <strong>{user.firstName} {user.lastName}</strong>
        </div>
      </header>

      {!activeProjectId ? (
        /* --- WIDOK Z LAB 1 (Zarządzanie Projektami) --- */
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
            <div key={p.id} className="project-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="project-title">{p.name}</h3>
                <p className="project-desc">{p.description}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleSelectProject(p.id)} className="edit-btn">Otwórz</button>
                <button onClick={(e) => handleDeleteProject(e, p.id)} className="delete-btn">Usuń</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* --- WIDOK Z LAB 2 (Zarządzanie Historyjkami w Projekcie) --- */
        <div>
          <button onClick={() => handleSelectProject(null)} className="delete-btn" style={{ marginBottom: '20px' }}>
            ← Powrót do listy projektów
          </button>
          
          <div className="project-header">
            <h2>Projekt: {activeProject?.name}</h2>
          </div>

          <form onSubmit={handleAddStory} className="form-container">
            <h3>Nowa historyjka</h3>
            <input placeholder="Nazwa historyjki" value={storyName} onChange={e => setStoryName(e.target.value)} className="input-field" />
            <textarea placeholder="Opis" value={storyDesc} onChange={e => setStoryDesc(e.target.value)} className="textarea-field" />
            <select value={storyPriority} onChange={e => setStoryPriority(e.target.value as StoryPriority)} className="input-field">
              <option value="low">Priorytet: Niski</option>
              <option value="medium">Priorytet: Średni</option>
              <option value="high">Priorytet: Wysoki</option>
            </select>
            <button type="submit" className="submit-btn">Dodaj zadanie</button>
          </form>

          <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '30px' }}>
            {(['todo', 'doing', 'done'] as StoryStatus[]).map(status => (
              <div key={status} className="column" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px' }}>
                <h4 style={{ textTransform: 'uppercase', textAlign: 'center', borderBottom: '1px solid white' }}>{status}</h4>
                {stories.filter(s => s.status === status).map(story => (
                  <div key={story.id} className="project-card" style={{ padding: '10px', marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#ffcc00' }}>{story.priority.toUpperCase()}</div>
                    <strong>{story.name}</strong>
                    <p style={{ fontSize: '0.8rem' }}>{story.description}</p>
                    <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
                      {status !== 'todo' && <button onClick={() => updateStoryStatus(story.id, 'todo')} className="edit-btn" style={{fontSize: '9px'}}>Todo</button>}
                      {status !== 'doing' && <button onClick={() => updateStoryStatus(story.id, 'doing')} className="edit-btn" style={{fontSize: '9px'}}>Doing</button>}
                      {status !== 'done' && <button onClick={() => updateStoryStatus(story.id, 'done')} className="edit-btn" style={{fontSize: '9px'}}>Done</button>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;