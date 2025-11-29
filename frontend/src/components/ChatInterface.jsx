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
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await axios.post(`${API_URL}/query`, {
        query: inputValue
      })

      const assistantMessage = {
        type: 'assistant',
        text: response.data.answer,
        sources: response.data.sources,
        processingTime: response.data.processing_time,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error querying assistant:', error)

      const errorMessage = {
        type: 'assistant',
        text: 'Omlouvám se, nastala chyba při zpracování vaší otázky. Zkuste to prosím znovu.',
        isError: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
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

              {/* Sources Section */}
              {message.sources && message.sources.length > 0 && message.type === 'assistant' && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                    <FileText className="h-3 w-3" />
                    <span>Zdroje informací</span>
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
      </div>
    </div>
  )
}

export default ChatInterface
