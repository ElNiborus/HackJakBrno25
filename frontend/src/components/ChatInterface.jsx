import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatInterface.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Convert markdown links to clickable links while preserving formatting
function renderTextWithLinks(text) {
  if (!text) return text

  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Add the link
    const linkText = match[1]
    const url = match[2]
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkText}
      </a>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

function ChatInterface({ userRole, userId }) {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      text: 'Dobrý den! Jsem virtuální asistent FN Brno. Jak vám mohu pomoci?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [keywordResults, setKeywordResults] = useState([])
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.lang = 'cs-CZ' // Czech language
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputValue(transcript)
        setIsListening(false)
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch (e) { /* ignore */ }
      }
    }
  }, [])

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
      console.log('[ChatInterface] User role:', userRole, 'User ID:', userId)
      const ragResponse = await axios.post(`${API_URL}/query`, { query, role: userRole, userId })
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

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Hlasové ovládání není podporováno ve vašem prohlížeči.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        setIsListening(false)
      }
    }
  }

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                <div className="message-text">{renderTextWithLinks(message.text)}</div>

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
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isLoading}
            className={`voice-button ${isListening ? 'listening' : ''}`}
            aria-label={isListening ? 'Zastavit nahrávání' : 'Začít hlasové zadávání'}
            title={isListening ? 'Zastavit nahrávání' : 'Hlasové zadávání'}
          >
            {isListening ? '🔴' : '🎤'}
          </button>
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
            {isLoading ? (
              '⏳'
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
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

