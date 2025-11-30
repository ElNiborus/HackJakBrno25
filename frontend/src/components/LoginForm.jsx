import { useState } from 'react'
import './LoginForm.css'

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Validate email format
    if (!email.endsWith('@fnbrno.cz')) {
      setError('Email musí mít příponu @fnbrno.cz')
      return
    }

    // Extract username from email (part before @)
    const emailUsername = email.split('@')[0].toLowerCase()

    // Check if code matches the username
    if (code.toLowerCase() !== emailUsername) {
      setError('Neplatný přihlašovací kód')
      return
    }

    // Map email usernames to user IDs (based on user_info.json)
    const userMapping = {
      'anna': { userId: 1, name: 'Anna Konecna', role: 'nurse' },
      'anna.konecna': { userId: 1, name: 'Anna Konecna', role: 'nurse' },
      'marek': { userId: 2, name: 'Marek Dvorak', role: 'manager' },
      'marek.dvorak': { userId: 2, name: 'Marek Dvorak', role: 'manager' },
      'petr': { userId: 3, name: 'Petr Svoboda', role: 'maintenance' },
      'petr.svoboda': { userId: 3, name: 'Petr Svoboda', role: 'maintenance' }
    }

    const userData = userMapping[emailUsername]
    
    if (!userData) {
      setError('Uživatel nenalezen v systému')
      return
    }

    // Call onLogin with user data
    onLogin(userData)
  }

  return (
    <div className="login-container">
      <div className="logo-container">
        <img src="/Resources/logo_nemocnice_bile.png" alt="FN Brno" className="login-logo" />
      </div>
      <div className="login-box">
        <div className="login-header">
          <h2>Přihlášení</h2>
          <p>Virtuální asistent FN Brno</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jmeno@fnbrno.cz"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Přihlašovací kód</label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Zadejte kód"
              required
              autoComplete="off"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Přihlásit se
          </button>
        </form>

        <div className="login-hint">
          <p className="hint-text">
            © 2025 Fakultní nemocnice Brno <br />
            Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
