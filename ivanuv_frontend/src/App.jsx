import { useState } from 'react'
import ChatInterface from './components/ChatInterface'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>FN Brno Virtuální asistent</h1>
          <p className="subtitle">Váš průvodce procesy a struktuře nemocnice</p>
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
