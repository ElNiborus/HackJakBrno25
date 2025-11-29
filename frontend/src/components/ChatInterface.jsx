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
  const [keywordResults, setKeywordResults] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

    console.log('[ChatInterface] Sending query:', query)
    console.log('[ChatInterface] API URL:', API_URL)
    const startTime = Date.now()

    try {
      // Run semantic search (RAG)
      console.log('[ChatInterface] Making POST request to /query...')
      const ragResponse = await axios.post(`${API_URL}/query`, { query })
      const elapsed = Date.now() - startTime
      console.log(`[ChatInterface] Response received in ${elapsed}ms:`, ragResponse.data)

      const assistantMessage = {
        type: 'assistant',
        text: ragResponse.data.answer,
        sources: ragResponse.data.sources,
        processingTime: ragResponse.data.processing_time,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      console.log('[ChatInterface] Message added to state')

    } catch (error) {
      const elapsed = Date.now() - startTime
      console.error(`[ChatInterface] Error after ${elapsed}ms:`, error)
      console.error('[ChatInterface] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      })

      const errorMessage = {
        type: 'assistant',
        text: 'Omlouvám se, nastala chyba při zpracování vaší otázky. Zkuste to prosím znovu.',
        isError: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      console.log('[ChatInterface] Loading state set to false')
    }
  }

  const handleDocumentClick = (documentName) => {
    // Download/open the document
    window.open(`${API_URL}/download/${documentName}`, '_blank')
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{message.text}</div>

                {message.sources && message.sources.length > 0 && (
                  <div className="sources-section">
                    <div className="sources-header">📚 {message.sources.length === 1 ? 'Zdroj informace:' : 'Zdroje informací:'}</div>
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="source-item"
                        onClick={() => handleDocumentClick(source.document_name)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="source-name">
                          {source.document_name}
                          <span className="relevance-score">
                            ({(source.relevance_score * 100).toFixed(0)}% shoda)
                          </span>
                        </div>
                        {source.metadata?.department && (
                          <div className="source-metadata">
                            📍 Oddělení: {source.metadata.department}
                          </div>
                        )}
                        {source.metadata?.process_owner && (
                          <div className="source-metadata">
                            👤 Vlastník procesu: {source.metadata.process_owner}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="message-timestamp">
                {formatTime(message.timestamp)}
                {message.processingTime && (
                  <span className="processing-time">
                    {' '}• {message.processingTime.toFixed(2)}s
                  </span>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
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
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>

        {!messages.some(m => m.type === 'user') && (
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
        )}
      </div>
    </div>
  )
}

export default ChatInterface
