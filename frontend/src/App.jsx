import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import './App.css'
import logo from '../Resources/logo_nemocnice_bile.png'

const users = [
  { userId: 1, name: 'Tereza', role: 'Sestřička' },
  { userId: 2, name: 'Hana', role: 'Vedoucí oddělení' },
  { userId: 3, name: 'Josef', role: 'Údržbář' }
]

function App() {
  const [selectedUserId, setSelectedUserId] = useState(1)
  const selectedUser = users.find(u => u.userId === selectedUserId)

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
            <a href="https://www.fnbrno.cz/" target="_blank" rel="noopener noreferrer">
              <img src={logo} alt="FN Brno Logo" style={{ height: '2.5rem', cursor: 'pointer', margin: '0.5rem' }} />
            </a>
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
              <h1>Virtuální asistent</h1>
              <p className="subtitle">Instituční průvodce strukturou a procesy nemocnice</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', opacity: '0.9' }}>Přihlášení:</span>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(Number(e.target.value))}
                className="role-selector"
              >
                {users.map(user => (
                  <option key={user.userId} value={user.userId}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ChatInterface userRole={selectedUser.role} userId={selectedUser.userId} />
      </main>
      <footer className="app-footer">
        <p>Fakultní nemocnice Brno - Interní nástroj pro zaměstnance</p>
      </footer>
    </div>
  )
}

export default App
