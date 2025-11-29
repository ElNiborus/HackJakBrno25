import ChatInterface from './components/ChatInterface'
import './App.css'
import { Building2 } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">FN Brno Virtuální asistent</h1>
              <p className="text-sm text-muted-foreground">Váš průvodce procesy a struktuře nemocnice</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-6 flex flex-col">
        <ChatInterface />
      </main>
    </div>
  )
}

export default App
