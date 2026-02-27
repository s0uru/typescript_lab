import { useState, useEffect } from 'react';
import type { Project } from './types/Project';
import { ProjectService } from './services/ProjectService';
import './App.css'; // <--- O TYM IMPORCIE NIE MOŻEMY ZAPOMNIEĆ!

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

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

  return (
    <div className="app-container">
      <h1>Project📔Manage</h1>

      {/* --- FORMULARZ DODAWANIA --- */}
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

      {/* --- LISTA PROJEKTÓW --- */}
      <div>
        {projects.length === 0 ? (
          <p className="empty-state">Brak projektów. Dodaj coś, żeby zacząć!</p>
        ) : (
          projects.map(project => (
            <div key={project.id} className="project-card">
              <h3 className="project-title">{project.name}</h3>
              <p className="project-desc">{project.description}</p>
              
              <button 
                onClick={() => handleDelete(project.id)}
                className="delete-btn"
              >
                Usuń
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;