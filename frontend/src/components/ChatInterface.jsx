import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatInterface.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Document Upload Form Component
function DocumentUploadForm({ onSubmit }) {
  const [files, setFiles] = useState({
    insurance: null,
    license: null
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0]
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)
    onSubmit(files)
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      marginTop: '15px'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
        Nahrání dokumentů pro osobní auto
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Pojištění vozidla:
          </label>
          <input
            type="file"
            name="insurance"
            onChange={handleFileChange}
            required
            accept=".pdf,.jpg,.jpeg,.png"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Řidičský průkaz:
          </label>
          <input
            type="file"
            name="license"
            onChange={handleFileChange}
            required
            accept=".pdf,.jpg,.jpeg,.png"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitted}
          style={{
            backgroundColor: isSubmitted ? '#28a745' : '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSubmitted ? 'default' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !isSubmitted && (e.target.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => !isSubmitted && (e.target.style.backgroundColor = '#007bff')}
        >
          {isSubmitted ? '✓' : 'Odeslat'}
        </button>
      </form>
    </div>
  )
}

// Travel Form Component
function TravelForm({ onSubmit, onDocumentUpload }) {
  const [formData, setFormData] = useState({
    destination: '',
    dateFrom: '',
    dateTo: '',
    transport: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)

    // Check if Osobní auto is selected
    if (formData.transport === 'Osobní auto') {
      setShowDocumentUpload(true)
    }

    onSubmit(formData)
  }

  const handleDocumentSubmit = (files) => {
    onDocumentUpload(files)
  }

  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
        Formulář pracovní cesty
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Destinace:
          </label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
            placeholder="Například: Praha, Brno, ..."
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Od:
          </label>
          <input
            type="date"
            name="dateFrom"
            value={formData.dateFrom}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Do:
          </label>
          <input
            type="date"
            name="dateTo"
            value={formData.dateTo}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Dopravní prostředek:
          </label>
          <select
            name="transport"
            value={formData.transport}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Vyberte dopravní prostředek...</option>
            <option value="Veřejná doprava">Veřejná doprava</option>
            <option value="Osobní auto">Osobní auto</option>
            <option value="Firemní auto">Firemní auto</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitted}
          style={{
            backgroundColor: isSubmitted ? '#28a745' : '#007bff',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSubmitted ? 'default' : 'pointer',
            transition: 'background-color 0.2s',
            opacity: isSubmitted ? 1 : 1
          }}
          onMouseEnter={(e) => !isSubmitted && (e.target.style.backgroundColor = '#0056b3')}
          onMouseLeave={(e) => !isSubmitted && (e.target.style.backgroundColor = '#007bff')}
        >
          {isSubmitted ? '✓' : 'Odeslat'}
        </button>
      </form>

      {showDocumentUpload && <DocumentUploadForm onSubmit={handleDocumentSubmit} />}
    </div>
  )
}

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
  const [sessionId, setSessionId] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [keywordResults, setKeywordResults] = useState([])
  const [pdfSidebarOpen, setPdfSidebarOpen] = useState(false)
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null)
  const [currentDocName, setCurrentDocName] = useState('')
  const [currentChunkText, setCurrentChunkText] = useState('')
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const pdfCanvasRef = useRef(null)
  const interimTranscriptRef = useRef('')

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
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        interimTranscriptRef.current = transcript

        // Only set final results to input
        if (event.results[event.results.length - 1].isFinal) {
          setInputValue(transcript)
          setIsListening(false)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        // If we have interim transcript when ending, save it to input
        if (interimTranscriptRef.current) {
          setInputValue(interimTranscriptRef.current)
          interimTranscriptRef.current = ''
        }
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

  // Load and render PDF when URL changes
  useEffect(() => {
    if (currentPdfUrl && pdfCanvasRef.current && window.pdfjsLib && currentChunkText) {
      const loadingTask = window.pdfjsLib.getDocument(currentPdfUrl)
      loadingTask.promise.then(async (pdf) => {
        let targetPage = 1
        let highlightRects = []
        
        // Normalize text for searching
        const normalizeText = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim()
        const chunkNormalized = normalizeText(currentChunkText)
        
        // Find the page containing the chunk
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageText = normalizeText(textContent.items.map(item => item.str).join(' '))
          
          // Check if this page contains the chunk (using first 50 chars)
          const chunkStartIndex = pageText.indexOf(chunkNormalized.substring(0, 50))
          
          if (chunkStartIndex !== -1) {
            targetPage = pageNum
            
            // Build the page text with item indices to find matching items
            let currentPos = 0
            let matchStartIdx = -1
            let matchEndIdx = -1
            
            for (let i = 0; i < textContent.items.length; i++) {
              const item = textContent.items[i]
              const itemText = normalizeText(item.str)
              const itemLength = itemText.length
              
              // Check if chunk starts within this item
              if (matchStartIdx === -1 && currentPos <= chunkStartIndex && currentPos + itemLength > chunkStartIndex) {
                matchStartIdx = i
              }
              
              // Check if chunk ends within this item
              if (matchStartIdx !== -1 && currentPos + itemLength >= chunkStartIndex + chunkNormalized.length) {
                matchEndIdx = i
                break
              }
              
              currentPos += itemLength + 1 // +1 for space
            }
            
            // Collect all items in the range
            if (matchStartIdx !== -1) {
              for (let i = matchStartIdx; i <= (matchEndIdx !== -1 ? matchEndIdx : textContent.items.length - 1); i++) {
                if (textContent.items[i].str.trim()) {
                  highlightRects.push(textContent.items[i])
                }
              }
            }
            
            break
          }
        }
        
        // Render the page
        const page = await pdf.getPage(targetPage)
        const canvas = pdfCanvasRef.current
        if (!canvas) return
        
        const context = canvas.getContext('2d')
        const viewport = page.getViewport({ scale: 1.5 })
        
        canvas.height = viewport.height
        canvas.width = viewport.width
        
        await page.render({ canvasContext: context, viewport }).promise
        
        // Draw continuous highlight
        console.log('Highlighting items:', highlightRects.length)
        if (highlightRects.length > 0) {
          context.fillStyle = 'rgba(255, 255, 0, 0.4)'
          highlightRects.forEach(item => {
            if (item.transform) {
              const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5])
              const width = item.width * viewport.scale
              const height = (item.height || 12) * viewport.scale
              context.fillRect(x, y - height, width, height)
            }
          })
        }
      }).catch(error => console.error('Error loading PDF:', error))
    }
    // log the chunks
    console.log('[ChatInterface] Current chunk text:', currentChunkText)
  }, [currentPdfUrl, currentChunkText])

  const handleFormSubmit = (formData) => {
    // Handle form submission - just thank the user
    let messageText = `Děkuji za vyplnění formuláře!\n\nVaše údaje:\n- Destinace: ${formData.destination}\n- Od: ${formData.dateFrom}\n- Do: ${formData.dateTo}\n- Dopravní prostředek: ${formData.transport}`

    // Only show thank you if not Osobní auto (document upload will be shown)
    if (formData.transport !== 'Osobní auto') {
      const thankYouMessage = {
        type: 'assistant',
        text: messageText,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, thankYouMessage])
    }
  }

  const handleDocumentUpload = (files) => {
    // Handle document upload - thank the user
    const thankYouMessage = {
      type: 'assistant',
      text: `Děkuji za nahrání dokumentů!\n\nNahrané soubory:\n- Pojištění vozidla: ${files.insurance?.name || 'Nenahrán'}\n- Řidičský průkaz: ${files.license?.name || 'Nenahrán'}\n\nVaše žádost o pracovní cestu byla úspěšně odeslána.`,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, thankYouMessage])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!inputValue.trim() || isLoading) return

    // Check if user typed "FORM"
    if (inputValue.trim().toUpperCase() === 'FORM') {
      const userMessage = {
        type: 'user',
        text: inputValue,
        timestamp: new Date()
      }

      const formMessage = {
        type: 'assistant',
        isForm: true,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage, formMessage])
      setInputValue('')
      return
    }

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
      // Call chat endpoint with session tracking
      console.log('[ChatInterface] Making POST request to /chat...')
      console.log('[ChatInterface] User role:', userRole, 'User ID:', userId)
      const requestBody = { query }
      if (sessionId) {
        requestBody.session_id = sessionId
      }

      const chatResponse = await axios.post(`${API_URL}/chat`, requestBody)
      const elapsed = Date.now() - startTime
      console.log(`[ChatInterface] Response received in ${elapsed}ms:`, chatResponse.data)

      // Store session ID for subsequent requests
      if (!sessionId) {
        setSessionId(chatResponse.data.session_id)
      }

      const assistantMessage = {
        type: 'assistant',
        text: chatResponse.data.message.content,
        sources: chatResponse.data.sources || [],
        usedRag: chatResponse.data.used_rag,
        processingTime: chatResponse.data.processing_time,
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

  const handleDocumentClick = (documentName, chunkText) => {
    // Open PDF in sidebar
    const pdfUrl = `${API_URL}/view-pdf/${documentName}`
    setCurrentPdfUrl(pdfUrl)
    setCurrentDocName(documentName)
    setCurrentChunkText(chunkText)
    setPdfSidebarOpen(true)
  }

  const closePdfSidebar = () => {
    setPdfSidebarOpen(false)
    setCurrentPdfUrl(null)
    setCurrentDocName('')
    setCurrentChunkText('')
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
                {message.isForm ? (
                  <TravelForm onSubmit={handleFormSubmit} onDocumentUpload={handleDocumentUpload} />
                ) : (
                  <>
                    <div className="message-text">{renderTextWithLinks(message.text)}</div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="sources-section">
                        <div className="sources-header">📚 {message.sources.length === 1 ? 'Zdroj informace:' : 'Zdroje informací:'}</div>
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="source-item"
                            onClick={() => handleDocumentClick(source.document_name, source.chunk_text)}
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
                  </>
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

      {/* PDF Sidebar */}
      {pdfSidebarOpen && (
        <div className="pdf-sidebar">
          <div className="pdf-sidebar-header">
            <h3>{currentDocName}</h3>
            <button onClick={closePdfSidebar} className="close-sidebar-btn">
              ✕
            </button>
          </div>
          <div className="pdf-sidebar-content">
            <canvas ref={pdfCanvasRef}></canvas>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface

