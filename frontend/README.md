# Frontend

React + Vite chat interface for the FN Brno Virtual Assistant.

## Quick Start

```bash
npm install
npm run dev
```

Access at http://localhost:3000 (or http://localhost:5173 depending on Vite config)

## Features

- **Chat Interface:** Multi-turn conversation with session management
- **Source Citations:** Document references with relevance scores
- **Document Download:** View and download source documents
- **Example Prompts:** Quick-start queries for common scenarios
- **Czech Language:** Full Czech language support

## Technology

- **React 18** - UI framework
- **Vite** - Build tool with hot module replacement
- **Axios** - HTTP client for backend API
- **Tailwind CSS** - Styling (if configured)

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                 # Main application component
│   ├── components/
│   │   └── ChatInterface.jsx   # Chat UI and message handling
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── public/                     # Static assets
├── vite.config.js              # Vite configuration
└── package.json                # Dependencies
```

## Configuration

### API Endpoint

By default, the frontend proxies requests to `http://localhost:8000` via Vite config.

**Development (`vite.config.js`):**
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': 'http://localhost:8000'
  }
}
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

## API Integration

The frontend communicates with the backend using Axios:

**Main Endpoint:**
```javascript
POST /chat
{
  query: "Jak si zařídit pracovní cestu?",
  session_id: "optional-session-id"
}
```

**Response:**
```javascript
{
  session_id: "uuid",
  message: {
    role: "assistant",
    content: "Answer in Czech...",
    sources: [...]
  },
  processing_time: 1.23
}
```
