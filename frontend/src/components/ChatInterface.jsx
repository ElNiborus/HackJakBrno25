import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './ChatInterface.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// localStorage utilities for work trips
// FORM1 saves work trips to localStorage for each user
// FORM2 loads saved trips and allows user to select one for expense reporting
const WORK_TRIPS_KEY = 'fnBrnoWorkTrips'

function saveWorkTrip(userId, tripData) {
  try {
    const existingTrips = getWorkTrips(userId)
    const newTrip = {
      id: Date.now(), // Simple ID based on timestamp
      ...tripData,
      createdAt: new Date().toISOString(),
      status: 'submitted'
    }
    existingTrips.push(newTrip)
    localStorage.setItem(`${WORK_TRIPS_KEY}_${userId}`, JSON.stringify(existingTrips))
    return newTrip
  } catch (error) {
    console.error('Error saving work trip to localStorage:', error)
    return null
  }
}

function getWorkTrips(userId) {
  try {
    const trips = localStorage.getItem(`${WORK_TRIPS_KEY}_${userId}`)
    return trips ? JSON.parse(trips) : []
  } catch (error) {
    console.error('Error reading work trips from localStorage:', error)
    return []
  }
}

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
    <div className="form-container" style={{
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
            disabled={isSubmitted}
            accept=".pdf,.jpg,.jpeg,.png"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: isSubmitted ? '#e9ecef' : 'white',
              cursor: isSubmitted ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box',
              maxWidth: '100%'
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
            disabled={isSubmitted}
            accept=".pdf,.jpg,.jpeg,.png"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: isSubmitted ? '#e9ecef' : 'white',
              cursor: isSubmitted ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box',
              maxWidth: '100%'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitted}
          style={{
            backgroundColor: isSubmitted ? '#0B2265' : '#0B2265',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: isSubmitted ? 'default' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => !isSubmitted && (e.target.style.backgroundColor = '#1a3378')}
          onMouseLeave={(e) => !isSubmitted && (e.target.style.backgroundColor = '#0B2265')}
        >
          {isSubmitted ? '✓' : 'Odeslat'}
        </button>
      </form>
    </div>
  )
}

// Receipt Upload Component for FORM2 (inline component)
function ReceiptUploadSection({ receipts, onReceiptChange, isSubmitted }) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    onReceiptChange(files)
  }

  const removeFile = (index) => {
    if (!isSubmitted) {
      const newReceipts = receipts.filter((_, i) => i !== index)
      onReceiptChange(newReceipts)
    }
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '10px',
        fontWeight: '500',
        color: '#555'
      }}>
        Účtenky a doklady:
      </label>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={isSubmitted}
        accept=".pdf,.jpg,.jpeg,.png"
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #ced4da',
          fontSize: '14px',
          backgroundColor: isSubmitted ? '#e9ecef' : 'white',
          cursor: isSubmitted ? 'not-allowed' : 'pointer',
          marginBottom: '10px'
        }}
      />

      {receipts.length > 0 && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #dee2e6',
          marginBottom: '10px'
        }}>
          <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
            Vybrané soubory ({receipts.length}):
          </div>
          {receipts.map((file, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              fontSize: '13px'
            }}>
              <span>{file.name}</span>
              {!isSubmitted && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Trip Expense Form Component (FORM2)
function TripExpenseForm({ onSubmit, userId }) {
  const [formData, setFormData] = useState({
    selectedTripId: '',
    totalAmount: '',
    receipts: []
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [availableTrips, setAvailableTrips] = useState([])

  // Load available work trips from localStorage
  useEffect(() => {
    const trips = getWorkTrips(userId)
    setAvailableTrips(trips)
  }, [userId])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleReceiptChange = (receipts) => {
    setFormData({
      ...formData,
      receipts: receipts
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitted(true)

    // Find the selected trip
    const selectedTrip = availableTrips.find(trip => trip.id.toString() === formData.selectedTripId)

    onSubmit({
      ...formData,
      selectedTrip: selectedTrip
    })
  }

  const formatTripOption = (trip) => {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    return `${trip.destination} (${formatDate(trip.dateFrom)} - ${formatDate(trip.dateTo)})`
  }

  return (
    <div className="form-container" style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
        Formulář pro vyúčtování pracovní cesty
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Vyberte pracovní cestu:
          </label>
          {availableTrips.length === 0 ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              color: '#856404',
              fontSize: '14px'
            }}>
              Nemáte žádné uložené pracovní cesty. Nejprve vyplňte formulář pro pracovní cestu (FORM).
            </div>
          ) : (
            <select
              name="selectedTripId"
              value={formData.selectedTripId}
              onChange={handleChange}
              required
              disabled={isSubmitted}
              className="form-select"
            >
              <option value="">Vyberte pracovní cestu...</option>
              {availableTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {formatTripOption(trip)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: '#555'
          }}>
            Celková částka výdajů:
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              required
              disabled={isSubmitted}
              min="0"
              step="0.01"
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                backgroundColor: isSubmitted ? '#e9ecef' : 'white',
                cursor: isSubmitted ? 'not-allowed' : 'text',
                paddingRight: '35px'
              }}
            />
            <span style={{
              position: 'absolute',
              right: '12px',
              fontSize: '14px',
              color: '#666',
              pointerEvents: 'none'
            }}>
              Kč
            </span>
          </div>
        </div>

        <ReceiptUploadSection
          receipts={formData.receipts}
          onReceiptChange={handleReceiptChange}
          isSubmitted={isSubmitted}
        />

        <button
          type="submit"
          disabled={isSubmitted || availableTrips.length === 0 || !formData.selectedTripId || !formData.totalAmount}
          style={{
            backgroundColor: isSubmitted ? '#0B2265' : '#0B2265',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: (isSubmitted || availableTrips.length === 0 || !formData.selectedTripId || !formData.totalAmount) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
            marginTop: '20px',
            opacity: (availableTrips.length === 0 || !formData.selectedTripId || !formData.totalAmount) && !isSubmitted ? 0.6 : 1
          }}
          onMouseEnter={(e) => !isSubmitted && availableTrips.length > 0 && formData.selectedTripId && formData.totalAmount && (e.target.style.backgroundColor = '#1a3378')}
          onMouseLeave={(e) => !isSubmitted && availableTrips.length > 0 && formData.selectedTripId && formData.totalAmount && (e.target.style.backgroundColor = '#0B2265')}
        >
          {isSubmitted ? '✓' : 'Odeslat žádost'}
        </button>
      </form>
    </div>
  )
}

// Travel Form Component
function TravelForm({ onSubmit, onDocumentUpload, userId }) {
  const [formData, setFormData] = useState({
    destination: '',
    dateFrom: '',
    dateTo: '',
    transport: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)

  // Check if user has referentske zkousky (Hana and Josef have them, Tereza doesn't)
  const hasReferentskeZkousky = userId === 2 || userId === 3 // Hana or Josef
  const userName = userId === 1 ? 'Tereza' : userId === 2 ? 'Hana' : 'Josef'

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
    <div className="form-container" style={{
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
            disabled={isSubmitted}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: isSubmitted ? '#e9ecef' : 'white',
              cursor: isSubmitted ? 'not-allowed' : 'text'
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
            disabled={isSubmitted}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: isSubmitted ? '#e9ecef' : 'white',
              cursor: isSubmitted ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box',
              maxWidth: '100%'
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
            disabled={isSubmitted}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              backgroundColor: isSubmitted ? '#e9ecef' : 'white',
              cursor: isSubmitted ? 'not-allowed' : 'pointer',
              boxSizing: 'border-box',
              maxWidth: '100%'
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
            disabled={isSubmitted}
            className="form-select"
          >
            <option value="">Vyberte dopravní prostředek...</option>
            <option value="Veřejná doprava">Veřejná doprava</option>
            <option value="Osobní auto">Osobní auto</option>
            <option value="Firemní auto">Firemní auto</option>
          </select>
        </div>

        {formData.transport === 'Firemní auto' && !isSubmitted && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            borderRadius: '8px',
            backgroundColor: hasReferentskeZkousky ? '#d4edda' : '#f8d7da',
            border: `1px solid ${hasReferentskeZkousky ? '#c3e6cb' : '#f5c6cb'}`,
            color: hasReferentskeZkousky ? '#155724' : '#721c24'
          }}>
            {hasReferentskeZkousky ? (
              <>
                <strong>✓ Oprávnění potvrzeno</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                  Máte referentské zkoušky a můžete použít firemní auto.
                </p>
              </>
            ) : (
              <>
                <strong>✗ Chybí oprávnění</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                  Nemáte referentské zkoušky a nemůžete použít firemní auto. Zvolte prosím jiný dopravní prostředek.
                </p>
              </>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitted || (formData.transport === 'Firemní auto' && !hasReferentskeZkousky)}
          style={{
            backgroundColor: isSubmitted ? '#0B2265' : '#0B2265',
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
          onMouseEnter={(e) => !isSubmitted && (e.target.style.backgroundColor = '#1a3378')}
          onMouseLeave={(e) => !isSubmitted && (e.target.style.backgroundColor = '#0B2265')}
        >
          {isSubmitted ? '✓' : 'Odeslat'}
        </button>
      </form>

      {showDocumentUpload && (
        <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
          <DocumentUploadForm onSubmit={handleDocumentSubmit} />
        </div>
      )}
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
  const [currentPage, setCurrentPage] = useState(1)
  const [collapsedSources, setCollapsedSources] = useState(() => {
    // Initialize all sources as collapsed by default
    const initialCollapsed = {};
    messages.forEach((msg, idx) => {
      if (msg.sources && msg.sources.length > 0) {
        initialCollapsed[`msg-${idx}`] = true;
      }
    });
    return initialCollapsed;
  })
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const pdfCanvasRef = useRef(null)
  const interimTranscriptRef = useRef('')
  const sourcesRefs = useRef({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToSource = (key) => {
  requestAnimationFrame(() => {
    const el = sourcesRefs.current[key];
    if (!el) return;
    el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
};

  useEffect(() => {
    // Only scroll to bottom when messages change, but not when just toggling sources
    scrollToBottom()
  }, [messages.length])

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

  // Handle Escape key to close PDF sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && pdfSidebarOpen) {
        closePdfSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [pdfSidebarOpen])

  // Load and render PDF when URL changes
  useEffect(() => {
    if (currentPdfUrl && pdfCanvasRef.current && window.pdfjsLib && currentChunkText) {
      const loadingTask = window.pdfjsLib.getDocument(currentPdfUrl)
      loadingTask.promise.then(async (pdf) => {
        let targetPage = 1
        let highlightRects = []
        
        // Normalize text for searching - keep only alphanumeric characters (including Czech)
        const normalizeText = (text) => text.toLowerCase().replace(/[^a-záčďéěíňóřšťúůýž0-9]/g, '')
        const chunkNormalized = normalizeText(currentChunkText)
        
        // Find the page containing the chunk
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum)
          const textContent = await page.getTextContent()
          const pageText = normalizeText(textContent.items.map(item => item.str).join(' '))
          
          // Check if this page contains the chunk (using first 50 chars)
          // const chunkStartIndex = pageText.indexOf(chunkNormalized.substring(0, 10))
          var chunkStartIndex = -1

          function similarity(s1, s2) {
            let longer = s1.length > s2.length ? s1 : s2;
            let shorter = s1.length > s2.length ? s2 : s1;
            let longerLen = longer.length;
            if (longerLen === 0) return 1.0;
            let editDist = levenshteinDistance(longer, shorter);
            return (longerLen - editDist) / longerLen;
          }

          function levenshteinDistance(a, b) {
            const dp = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
            for (let i = 0; i <= a.length; i++) dp[0][i] = i;
            for (let j = 0; j <= b.length; j++) dp[j][0] = j;
            for (let j = 1; j <= b.length; j++) {
              for (let i = 1; i <= a.length; i++) {
                if (a[i-1] === b[j-1]) dp[j][i] = dp[j-1][i-1];
                else dp[j][i] = 1 + Math.min(dp[j-1][i], dp[j][i-1], dp[j-1][i-1]);
              }
            }
            return dp[b.length][a.length];
          }

          const chunk = chunkNormalized.substring(0, 25);
          for (let i = 0; i <= pageText.length - chunk.length; i+= 5) {
            let sub = pageText.substring(i, i + chunk.length);
            if (similarity(sub, chunk) >= 0.7) {
              console.log("Found at index", i);
              console.log("Compared strings:", sub, "AND", chunk);
              chunkStartIndex = i;
              break;
            }
          }
          
          if (chunkStartIndex !== -1) {
            targetPage = pageNum
            setCurrentPage(pageNum)
            
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
              //if (matchEndIdx !== -1) {
              //  matchStartIdx -= 24
              //  matchEndIdx += 24
              //}
              for (let i = matchStartIdx; i <= (matchEndIdx !== -1 ? matchEndIdx : textContent.items.length - 1); i++) {
                if (textContent && textContent.items && textContent.items[i] && textContent.items[i].str.trim()) {
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
    // Save work trip to localStorage for the current user
    const savedTrip = saveWorkTrip(userId, formData)

    // Handle form submission - thank the user
    let messageText = `Děkuji za vyplnění formuláře!\n\nVaše údaje:\n- Destinace: ${formData.destination}\n- Od: ${formData.dateFrom}\n- Do: ${formData.dateTo}\n- Dopravní prostředek: ${formData.transport}`

    if (savedTrip) {
      messageText += `\n\nPracovní cesta byla uložena do systému pro pozdější vyúčtování.`
    }

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

  const handleForm2Submit = (formData) => {
    // Handle trip expense form submission
    const formatDate = (dateStr) => {
      if (!dateStr) return 'Nezadáno'
      const date = new Date(dateStr)
      return date.toLocaleDateString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    const formatCurrency = (amount) => {
      const num = parseFloat(amount)
      if (isNaN(num)) return '0 Kč'
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(num)
    }

    const receiptsList = formData.receipts.length > 0
      ? formData.receipts.map((file, index) => `  ${index + 1}. ${file.name}`).join('\n')
      : '  (žádné soubory nebyly nahrány)'

    const selectedTrip = formData.selectedTrip
    const tripDetails = selectedTrip
      ? `\n\nVybraná pracovní cesta:\n- Destinace: ${selectedTrip.destination}\n- Od: ${formatDate(selectedTrip.dateFrom)}\n- Do: ${formatDate(selectedTrip.dateTo)}\n- Dopravní prostředek: ${selectedTrip.transport}`
      : '\n\nChyba: Nebyla vybrána žádná pracovní cesta.'

    const thankYouMessage = {
      type: 'assistant',
      text: `Děkuji za vyplnění formuláře pro vyúčtování pracovní cesty!${tripDetails}\n\nCelková částka výdajů: ${formatCurrency(formData.totalAmount)}\nPočet nahraných účtenek: ${formData.receipts.length}\n\nNahrané soubory:\n${receiptsList}\n\nVaše žádost o vyúčtování byla úspěšně odeslána ke schválení.`,
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

    // Check if user typed "FORM2"
    if (inputValue.trim().toUpperCase() === 'FORM2') {
      const userMessage = {
        type: 'user',
        text: inputValue,
        timestamp: new Date()
      }

      const formMessage = {
        type: 'assistant',
        isForm2: true,
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

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        // Set new message sources as collapsed by default
        if (assistantMessage.sources && assistantMessage.sources.length > 0) {
          setCollapsedSources(prevCollapsed => ({
            ...prevCollapsed,
            [`msg-${newMessages.length - 1}`]: true
          }));
        }
        return newMessages;
      })
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
    // Get file extension
    const extension = documentName.split('.').pop().toLowerCase();
    
    if (extension === 'xlsx') {
      // For Excel files, trigger download
      const downloadUrl = `${API_URL}/download/${documentName}`;
      console.log('[ChatInterface] Downloading file:', downloadUrl)
      window.open(downloadUrl, '_blank');
    } else {
      // For docx and other files, open PDF in sidebar
      const pdfName = documentName.replace(/\.[^/.]+$/, ".pdf");
      const pdfUrl = `${API_URL}/view-pdf/${pdfName}`;
      console.log('[ChatInterface] Opening PDF:', pdfUrl)
      setCurrentPdfUrl(pdfUrl)
      setCurrentDocName(documentName)
      setCurrentChunkText(chunkText)
      setPdfSidebarOpen(true)
    }
  }

  const closePdfSidebar = () => {
    setPdfSidebarOpen(false)
    setCurrentPdfUrl(null)
    setCurrentDocName('')
    setCurrentChunkText('')
    setCurrentPage(1)
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
              {message.type === 'assistant' ? (
                <>
                  <img
                    src="/robot.png"
                    alt="Robot Assistant"
                    className="robot-avatar"
                  />
                  <div className="message-wrapper">
                    <div className="message-content">
                {message.isForm ? (
                  <TravelForm onSubmit={handleFormSubmit} onDocumentUpload={handleDocumentUpload} userId={userId} />
                ) : message.isForm2 ? (
                  <TripExpenseForm onSubmit={handleForm2Submit} userId={userId} />
                ) : (
                  <>
                    <div className="message-text">{renderTextWithLinks(message.text)}</div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="sources-section" ref={el => sourcesRefs.current[`msg-${index}`] = el}>
                        <div 
                          className="sources-header" 
                          onClick={() => {
                            const messageKey = `msg-${index}`;
                            const isCurrentlyCollapsed = collapsedSources[messageKey];
                            setCollapsedSources(prev => ({
                              ...prev,
                              [messageKey]: !prev[messageKey]
                            }));
                            // If expanding, scroll to show the content
                            if (isCurrentlyCollapsed) {
                              scrollToSource(messageKey);
                            }
                          }}
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          <span style={{ 
                            marginRight: '8px',
                            display: 'inline-block',
                            transition: 'transform 0.2s',
                            transform: collapsedSources[`msg-${index}`] ? 'rotate(-90deg)' : 'rotate(0deg)'
                          }}>
                            ▼
                          </span>
                          📚 {message.sources.length === 1 ? 'Zdroj informace:' : 'Zdroje informací:'}
                        </div>
                        {!collapsedSources[`msg-${index}`] && (() => {
                          // Sort sources by document_name
                          const sortedSources = [...message.sources].sort((a, b) => 
                            a.document_name.localeCompare(b.document_name, 'cs')
                          );
                          
                          // Group by document_name
                          const groupedSources = {};
                          sortedSources.forEach(source => {
                            if (!groupedSources[source.document_name]) {
                              groupedSources[source.document_name] = [];
                            }
                            groupedSources[source.document_name].push(source);
                          });
                          
                          return Object.entries(groupedSources).map(([docName, sources], groupIdx) => {
                            const isXlsx = docName.toLowerCase().endsWith('.xlsx');
                            
                            return (
                              <div key={groupIdx} style={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                marginBottom: '8px',
                                fontSize: '14px',
                                transition: 'box-shadow 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                                <span style={{ flex: 1, fontWeight: '500', color: '#333' }}>{docName}</span>
                                {isXlsx ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDocumentClick(sources[0].document_name, sources[0].chunk_text);
                                    }}
                                    style={{
                                      backgroundColor: '#e8eef8',
                                      color: '#0B2265',
                                      border: '1px solid #c5d0de',
                                      borderRadius: '6px',
                                      padding: '6px 14px',
                                      fontSize: '13px',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#d4dcec';
                                      e.target.style.borderColor = '#1a3378';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = '#e8eef8';
                                      e.target.style.borderColor = '#c5d0de';
                                    }}
                                  >
                                    {sources.length > 1 ? `Úseky 1-${sources.length}` : 'Úsek 1'}
                                  </button>
                                ) : (
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {sources.map((source, idx) => (
                                      <button
                                        key={idx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDocumentClick(source.document_name, source.chunk_text);
                                        }}
                                        style={{
                                          backgroundColor: '#e8eef8',
                                          color: '#0B2265',
                                          border: '1px solid #c5d0de',
                                          borderRadius: '6px',
                                          padding: '6px 12px',
                                          fontSize: '13px',
                                          fontWeight: '500',
                                          cursor: 'pointer',
                                          whiteSpace: 'nowrap',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = '#d4dcec';
                                          e.target.style.borderColor = '#1a3378';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = '#e8eef8';
                                          e.target.style.borderColor = '#c5d0de';
                                        }}
                                      >
                                        Úsek {idx + 1}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
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
                </>
              ) : (
                <>
                  <div className="message-content">
                    {message.isForm ? (
                      <TravelForm onSubmit={handleFormSubmit} onDocumentUpload={handleDocumentUpload} userId={userId} />
                    ) : message.isForm2 ? (
                      <TripExpenseForm onSubmit={handleForm2Submit} userId={userId} />
                    ) : (
                      <>
                        <div className="message-text">{renderTextWithLinks(message.text)}</div>

                        {message.sources && message.sources.length > 0 && (
                          <div className="sources-section" ref={el => sourcesRefs.current[`msg-${index}`] = el}>
                            <div
                              className="sources-header"
                              onClick={() => {
                                const messageKey = `msg-${index}`;
                                const isCurrentlyCollapsed = collapsedSources[messageKey];
                                setCollapsedSources(prev => ({
                                  ...prev,
                                  [messageKey]: !prev[messageKey]
                                }));
                                // If expanding, scroll to show the content
                                if (isCurrentlyCollapsed) {
                                  scrollToSource(messageKey);
                                }
                              }}
                              style={{ cursor: 'pointer', userSelect: 'none' }}
                            >
                              <span style={{
                                marginRight: '8px',
                                display: 'inline-block',
                                transition: 'transform 0.2s',
                                transform: collapsedSources[`msg-${index}`] ? 'rotate(-90deg)' : 'rotate(0deg)'
                              }}>
                                ▼
                              </span>
                              📚 {message.sources.length === 1 ? 'Zdroj informace:' : 'Zdroje informací:'}
                            </div>
                            {/* ... rest of sources content would go here ... */}
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
                </>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="message assistant">
              <img
                src="/robot.png"
                alt="Robot Assistant"
                className="robot-avatar"
              />
              <div className="message-wrapper">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

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

        <form onSubmit={handleSubmit} className="input-container">
          <div className="input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Napište svou otázku..."
              disabled={isLoading}
              className="chat-input"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`voice-button ${isListening ? 'listening' : ''}`}
              aria-label={isListening ? 'Zastavit nahrávání' : 'Začít hlasové zadávání'}
              title={isListening ? 'Zastavit nahrávání' : 'Hlasové zadávání'}
            >
              {isListening ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#dc2626" stroke="#dc2626" strokeWidth="2"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="9" y="4" width="6" height="10" rx="3" stroke="#6b7280" strokeWidth="2"/>
                  <path d="M6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="18" x2="12" y2="21" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="9" y1="21" x2="15" y2="21" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
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
      </div>

      {/* PDF Sidebar */}
      {pdfSidebarOpen && (
        <div className="pdf-sidebar">
          <div className="pdf-sidebar-header">
            <h3>
              <a 
                href={`${API_URL}/view-pdf/${currentDocName.replace(/\.[^/.]+$/, ".pdf")}#page=${currentPage}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {currentDocName.replace(/\.[^/.]+$/, ".pdf")}
              </a>
            </h3>
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

