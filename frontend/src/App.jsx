import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import './App.css'
import logo from '../Resources/logo_nemocnice.svg'

function App() {
  const [userRole, setUserRole] = useState('Sestřička')

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src={logo} alt="FN Brno Logo" style={{ height: '2.5rem' }} />
              <div>
                <h1>FN Brno Virtuální asistent</h1>
                <p className="subtitle">Váš průvodce procesy a struktuře nemocnice</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', opacity: '0.9' }}>Přihlášení:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="role-selector"
              >
                <option value="Sestřička">Tereza (Sestřička)</option>
                <option value="Vedoucí oddělení">Hana (Vedoucí oddělení)</option>
                <option value="Údržbář">Josef (Údržbář)</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ChatInterface userRole={userRole} />
      </main>
      <footer className="app-footer">
        <p>Fakultní nemocnice Brno - Interní nástroj pro zaměstnance</p>
      </footer>
    </div>
  )
}

export default App
