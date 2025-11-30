import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import LoginForm from './components/LoginForm'
import './App.css'
import logo from '../Resources/logo_nemocnice_bile.png'

const roleDisplayNames = {
  'nurse': 'Sestřička',
  'manager': 'Vedoucí oddělení',
  'maintenance': 'Údržbář'
}

function App() {
  // Default to Anna logged in
  const [currentUser, setCurrentUser] = useState({
    userId: 1,
    name: 'Anna Konecna',
    role: 'nurse'
  })

  const handleLogin = (userData) => {
    setCurrentUser(userData)
  }

  const handleLogout = () => {
    setCurrentUser(null)
  }

  // If not logged in, show login form
  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} />
  }

  const roleDisplay = roleDisplayNames[currentUser.role] || currentUser.role

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: 'white', fontSize: '14px' }}>
                <strong>{currentUser.name}</strong> ({roleDisplay})
              </span>
              <button
                onClick={handleLogout}
                className="logout-button"
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                Odhlásit se
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ChatInterface userRole={currentUser.role} userId={currentUser.userId} />
      </main>
      <footer className="app-footer">
        <p>Fakultní nemocnice Brno - Interní nástroj pro zaměstnance</p>
      </footer>
    </div>
  )
}

export default App
