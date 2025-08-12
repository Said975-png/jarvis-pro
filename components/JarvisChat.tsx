import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface JarvisChatProps {
  isOpen: boolean
  onClose: () => void
}

export default function JarvisChat({ isOpen, onClose }: JarvisChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет Я ДЖАРВИС ваш AI-помощник в мире веб-разработки Чем могу помочь',
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputText])

  const generateJarvisResponse = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    try {
      // Подготавливаем историю сообщений для API
      const apiMessages = conversationHistory
        .filter(msg => msg.text !== 'Привет Я ДЖАРВИС ваш AI-помощник в мире веб-разработки Чем могу помочь') // Исключаем начальное сообщение
        .map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }))

      // Добавляем текущее сообщение пользователя
      apiMessages.push({
        role: 'user',
        content: userMessage
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      return data.message
    } catch (error) {
      console.error('Error calling AI API:', error)

      // Резервные ответы в случае ошибки
      const fallbackResponses = [
        'Я ДЖАРВИС и я здесь, чтобы помочь! Попробуйте ещё раз. Если проблемы повторяются - опишите ваш вопрос подробнее! 🚀',
        'Привет! Я ДЖАРВИС и всегда готов помочь с веб-разработкой! Попробуйте переформулировать вопрос или задайте новый! ✨',
        'Я готов ответить на любые вопросы о веб-разработке и AI! Попробуйте снова. 🔧',
      ]

      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    }
  }

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    }

    const currentInput = inputText
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      // Получаем ответ от AI
      const aiText = await generateJarvisResponse(currentInput, [...messages, userMessage])

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error generating AI response:', error)

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка. Попробуйте еще раз или напишите мне в Telegram ',
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="jarvis-chat-overlay">
      <div className="jarvis-chat-container">
        {/* Header */}
        <div className="jarvis-chat-header">
          <div className="jarvis-chat-title">
            <div className="jarvis-avatar">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F86ccad5be3604b288119b4c361741253%2F60b029911e0b4e74939cea888d93edb9?format=webp&width=800"
                alt="JARVIS"
                width="32"
                height="32"
                style={{borderRadius: '50%', objectFit: 'cover'}}
              />
            </div>
            <div className="title-info">
              <h3>ДЖАРВИС</h3>
              <div className="status-indicator">
                <div className="status-dot"></div>
                В сети
              </div>
            </div>
          </div>
          <button className="jarvis-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="jarvis-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
            >
              {!message.isUser && (
                <div className="message-avatar">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F86ccad5be3604b288119b4c361741253%2F60b029911e0b4e74939cea888d93edb9?format=webp&width=800"
                    alt="JARVIS"
                    width="28"
                    height="28"
                    style={{borderRadius: '50%', objectFit: 'cover'}}
                  />
                </div>
              )}
              <div className="message-content">
                <div className="message-bubble">
                  {message.text.split('\n').map((line, index) => (
                    <div key={index}>
                      {line}
                      {index < message.text.split('\n').length - 1 && <br />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message ai-message">
              <div className="message-avatar">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F86ccad5be3604b288119b4c361741253%2F60b029911e0b4e74939cea888d93edb9?format=webp&width=800"
                  alt="JARVIS"
                  width="28"
                  height="28"
                  style={{borderRadius: '50%', objectFit: 'cover'}}
                />
              </div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <div className="typing-dots">
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

        {/* Input */}
        <div className="jarvis-input-area">
          <div className="jarvis-input-container">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение ДЖАРВИСУ"
              className="jarvis-textarea"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="jarvis-send-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M7 11L12 6L17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .jarvis-chat-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .jarvis-chat-container {
          width: 100%;
          max-width: 800px;
          height: 85vh;
          background: #ffffff;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .jarvis-chat-header {
          padding: 16px 20px;
          background: #f7f7f8;
          border-bottom: 1px solid #e5e5e7;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .jarvis-chat-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .jarvis-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .jarvis-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title-info h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 2px 0;
          color: #0d1117;
        }

        .status-indicator {
          font-size: 12px;
          color: #656d76;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .jarvis-close-btn {
          background: none;
          border: none;
          color: #656d76;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .jarvis-close-btn:hover {
          background: #e7e7e9;
          color: #0d1117;
        }

        .jarvis-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: #ffffff;
        }

        .message {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          max-width: 70%;
        }

        .user-message {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .ai-message {
          align-self: flex-start;
        }

        .message-avatar {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          margin-top: 2px;
          border-radius: 50%;
          overflow: hidden;
        }

        .message-content {
          display: flex;
          flex-direction: column;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 15px;
          line-height: 1.6;
          word-wrap: break-word;
          position: relative;
        }

        .user-message .message-bubble {
          background: #0066cc;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }

        .ai-message .message-bubble {
          background: #f1f3f4;
          color: #0d1117;
          border-bottom-left-radius: 4px;
          border: 1px solid #e5e5e7;
        }

        .typing-indicator {
          background: #f1f3f4 !important;
          border: 1px solid #e5e5e7 !important;
          padding: 16px !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .typing-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #8e8ea0;
          animation: typingBounce 1.4s ease-in-out infinite;
        }

        .typing-dots span:nth-child(1) { animation-delay: 0s; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
          0%, 60%, 100% { 
            transform: translateY(0);
            opacity: 0.4;
          }
          30% { 
            transform: translateY(-8px);
            opacity: 1;
          }
        }

        .jarvis-input-area {
          padding: 24px;
          background: #f7f7f8;
          border-top: 1px solid #e5e5e7;
        }

        .jarvis-input-container {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #d0d7de;
          border-radius: 12px;
          padding: 12px 16px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .jarvis-input-container:focus-within {
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .jarvis-textarea {
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          outline: none;
          font-size: 15px;
          line-height: 1.5;
          max-height: 120px;
          min-height: 24px;
          color: #0d1117;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .jarvis-textarea::placeholder {
          color: #8e8ea0;
          text-align: center;
        }

        .jarvis-textarea:disabled {
          color: #8e8ea0;
        }

        .jarvis-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #0066cc;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .jarvis-send-btn:hover:not(:disabled) {
          background: #0052a3;
          transform: translateY(-1px);
        }

        .jarvis-send-btn:disabled {
          background: #d0d7de;
          color: #8e8ea0;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .jarvis-chat-overlay {
            padding: 0;
          }

          .jarvis-chat-container {
            height: 100vh;
            max-width: 100%;
            border-radius: 0;
          }

          .jarvis-chat-header {
            padding: 16px 20px;
          }

          .jarvis-messages {
            padding: 20px 16px;
          }

          .jarvis-input-area {
            padding: 16px 20px;
          }

          .message {
            max-width: 85%;
          }
        }
      `}</style>
    </div>
  )
}
