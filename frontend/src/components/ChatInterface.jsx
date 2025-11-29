import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Send, FileText, Building2, User } from 'lucide-react'
import { cn } from '../lib/utils'

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
    <div className="flex-1 flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex w-full animate-fade-in",
              message.type === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                message.type === 'user'
                  ? "bg-chat-user text-chat-user-text rounded-br-md"
                  : "bg-chat-bot text-chat-bot-text rounded-bl-md"
              )}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

<<<<<<< HEAD
              {/* Sources Section */}
              {message.sources && message.sources.length > 0 && message.type === 'assistant' && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                    <FileText className="h-3 w-3" />
                    <span>Zdroje informací</span>
=======
                {message.sources && message.sources.length > 0 && (
                  <div className="sources-section">
                    <div className="sources-header">📚 Zdroje informací:</div>
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
>>>>>>> 6e84450 (Clicklable links)
                  </div>
                  {message.sources.map((source, idx) => (
                    <div key={idx} className="text-xs space-y-1 bg-background/50 rounded-lg p-2">
                      <div className="font-medium flex items-center justify-between">
                        <span className="truncate">{source.document_name}</span>
                        <span className="text-[10px] opacity-70 ml-2 shrink-0">
                          {(source.relevance_score * 100).toFixed(0)}% shoda
                        </span>
                      </div>
                      {source.metadata?.department && (
                        <div className="flex items-center gap-1 opacity-70">
                          <Building2 className="h-3 w-3" />
                          <span>{source.metadata.department}</span>
                        </div>
                      )}
                      {source.metadata?.process_owner && (
                        <div className="flex items-center gap-1 opacity-70">
                          <User className="h-3 w-3" />
                          <span>{source.metadata.process_owner}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <span className="text-xs opacity-70 mt-2 block">
                {formatTime(message.timestamp)}
                {message.processingTime && message.type === 'assistant' && (
                  <span className="ml-2">• {message.processingTime.toFixed(2)}s</span>
                )}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex w-full animate-fade-in justify-start">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 shadow-sm bg-chat-bot text-chat-bot-text rounded-bl-md">
              <div className="flex gap-1">
                <span className="animate-bounce delay-0">●</span>
                <span className="animate-bounce delay-75">●</span>
                <span className="animate-bounce delay-150">●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Napište svou otázku..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
<<<<<<< HEAD
=======

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
              onClick={() => setInputValue('Jak si zařídit pracovní cestu? Mohu použít své auto?')}
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
>>>>>>> 6e84450 (Clicklable links)
      </div>
    </div>
  )
}

export default ChatInterface
