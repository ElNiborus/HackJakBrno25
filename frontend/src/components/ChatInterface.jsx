import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatInterface.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      text: 'Dobrý den! Jsem virtuální asistent FN Brno. Jak vám mohu pomoci?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        try { abortRef.current.abort() } catch (e) { /* ignore */ }
      }
    }
  }, [])

  const formatTime = (dateLike) => {
    const d = dateLike ? new Date(dateLike) : new Date()
    try {
      return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return d.toISOString()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage = {
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const query = inputValue
    setInputValue('')
    setIsLoading(true)

    const startTime = Date.now()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const ragResponse = await axios.post(
        `${API_URL}/query`,
        { query },
        { signal: controller.signal, timeout: 30000 }
      )

      const assistantMessage = {
        type: 'assistant',
        text: ragResponse.data.answer || 'Žádná odpověď od serveru.',
        sources: Array.isArray(ragResponse.data.sources) ? ragResponse.data.sources : [],
        processingTime: ragResponse.data.processing_time,
        timestamp: ragResponse.data.timestamp ? new Date(ragResponse.data.timestamp) : new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chyba při dotazu:', error)
      const errorMessage = {
        type: 'assistant',
        text: 'Omlouvám se, nastala chyba při zpracování vaší otázky. Zkuste to prosím znovu.',
        isError: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      abortRef.current = null
    }
  }

  const handleDocumentClick = async (documentName) => {
    if (!documentName) return
    const safeName = encodeURIComponent(documentName)
    const url = `${API_URL}/download/${safeName}`

    try {
      const response = await axios.get(url, {
        responseType: 'blob',
        timeout: 30000
      })

      const blob = new Blob([response.data])
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = documentName
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000)
    } catch (err) {
      console.error('Chyba při stahování dokumentu', err)
      try {
        window.open(`${API_URL}/download/${safeName}`, '_blank', 'noopener')
      } catch (e) {
        console.error('Fallback open failed', e)
      }
    }
  }

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => {
            const key = (message.id ? message.id : `${new Date(message.timestamp).getTime() || index}`) + `-${index}`
            const sources = Array.isArray(message.sources) ? message.sources : []

            // === Deduplikace podle document_name (ponechat první výskyt) ===
            const uniqueMap = new Map()
            sources.forEach((s) => {
              // klíč: preferuj document_name, fallback na url nebo na stringified obsah
              const nameKey = s?.document_name ?? s?.url ?? JSON.stringify(s)
              if (!uniqueMap.has(nameKey)) uniqueMap.set(nameKey, s)
            })
            const uniqueSources = Array.from(uniqueMap.values())
            // ============================================================

            return (
              <div key={key} className={`message ${message.type}`}>
                <div className="message-content">
                  <div className="message-text">{message.text}</div>

                  {uniqueSources.length > 0 && (
                    <div className="sources-section">
                      <div className="sources-header">📚 Zdroje informací:</div>
                      {uniqueSources.map((source, idx) => {
                        const docName = source.document_name ?? source.url ?? `zdroj-${idx}`
                        return (
                          <div
                            key={`${docName}-${idx}`}
                            className="source-item"
                            onClick={() => handleDocumentClick(docName)}
                            style={{ cursor: 'pointer' }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDocumentClick(docName) }}
                          >
                            <div className="source-name">
                              {docName}
                              {typeof source.relevance_score === 'number' && (
                                <span className="relevance-score">
                                  {' '}({(source.relevance_score * 100).toFixed(0)}% shoda)
                                </span>
                              )}
                            </div>
                            {source.metadata?.department && (
                              <div className="source-metadata">📍 Oddělení: {source.metadata.department}</div>
                            )}
                            {source.metadata?.process_owner && (
                              <div className="source-metadata">👤 Vlastník procesu: {source.metadata.process_owner}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="message-timestamp">
                    {formatTime(message.timestamp)}
                    {message.processingTime != null && !isNaN(message.processingTime) && (
                      <span className="processing-time"> {' '}• {Number(message.processingTime).toFixed(2)}s</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Napište svou otázku..."
            disabled={isLoading}
            className="chat-input"
            aria-label="Zadejte dotaz"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-button"
            aria-label="Odeslat"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>

        <div className="example-queries">
          <p className="example-title">💡 Příklady otázek:</p>
          <div className="example-buttons">
            <button
              onClick={() => setInputValue('Co mám dělat, když si chci koupit nový mobil?')}
              className="example-button"
              disabled={isLoading}
            >
              Nákup mobilu
            </button>
            <button
              onClick={() => setInputValue('Jak si zařídit pracovní cestu? Mohu použít moje auto?')}
              className="example-button"
              disabled={isLoading}
            >
              Pracovní cesta
            </button>
            <button
              onClick={() => setInputValue('Jaké procesy má oddělení CI?')}
              className="example-button"
              disabled={isLoading}
            >
              Procesy CI
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
