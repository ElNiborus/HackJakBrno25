import ChatInterface from './components/ChatInterface'
import './App.css'
import logo from '../Resources/logo_nemocnice.svg'

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={logo} alt="FN Brno Logo" style={{ height: '2.5rem' }} />
            <div>
              <h1>FN Brno Virtuální asistent</h1>
              <p className="subtitle">Váš průvodce procesy a struktuře nemocnice</p>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ChatInterface />
      </main>
      <footer className="app-footer">
        <p>Fakultní nemocnice Brno - Interní nástroj pro zaměstnance</p>
      </footer>
    </div>
  )
}

export default App
