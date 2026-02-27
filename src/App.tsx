import { useState, useEffect } from 'react';
import type { Project } from './types/Project';
import { ProjectService } from './services/ProjectService';
import './App.css';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    setProjects(ProjectService.getAll());
  }, []);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    ProjectService.create(name, description);
    setName('');
    setDescription('');
    setProjects(ProjectService.getAll());
  };

  const handleDelete = (id: string) => {
    ProjectService.delete(id);
    setProjects(ProjectService.getAll());
  };

  const startEditing = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditDescription(project.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const handleUpdateProject = (id: string) => {
    if (!editName.trim()) return; 
    
    ProjectService.update(id, { name: editName, description: editDescription });
    
    setEditingId(null);
    setProjects(ProjectService.getAll());
  };

  return (
    <div className="app-container">
      <h1 className="app-title">PrismBoard</h1>

      <form onSubmit={handleAddProject} className="form-container">
        <input 
          placeholder="Nazwa projektu" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
        />
        <textarea 
          placeholder="Krótki opis" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="textarea-field"
        />
        <button type="submit" className="submit-btn">
          Dodaj projekt
        </button>
      </form>

      <hr className="divider" />

      <div>
        {projects.length === 0 ? (
          <p className="empty-state">Brak projektów. Dodaj coś, żeby zacząć!</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              
              {editingId === project.id ? (
                <div className="edit-form-inline">
                  <input 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field"
                  />
                  <textarea 
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="textarea-field"
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleUpdateProject(project.id)} className="submit-btn" style={{ flex: 1 }}>Zapisz</button>
                    <button onClick={cancelEditing} className="delete-btn" style={{ flex: 1 }}>Anuluj</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="project-title">{project.name}</h3>
                  <p className="project-desc">{project.description}</p>
                  
                  <div className="card-actions">
                    <button onClick={() => startEditing(project)} className="edit-btn">
                      Edytuj
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="delete-btn">
                      Usuń
                    </button>
                  </div>
                </>
              )}
              
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;