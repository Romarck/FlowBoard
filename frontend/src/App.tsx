import { useState, useEffect } from 'react'
import './App.css'

interface HealthResponse {
  status: string
}

function App() {
  const [health, setHealth] = useState<string>('checking...')

  useEffect(() => {
    fetch('/health')
      .then((res) => res.json())
      .then((data: HealthResponse) => setHealth(data.status))
      .catch(() => setHealth('unreachable'))
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>FlowBoard</h1>
        <p>Agile Project Management</p>
      </header>
      <main className="app-main">
        <div className="status-card">
          <h2>Project Setup Complete</h2>
          <p>
            Backend API status: <strong className={`status-${health}`}>{health}</strong>
          </p>
          <p className="hint">
            This is a placeholder page. The full UI will be built in upcoming stories.
          </p>
        </div>
      </main>
      <footer className="app-footer">
        <p>FlowBoard v0.1.0 — Wave 0 Setup</p>
      </footer>
    </div>
  )
}

export default App
