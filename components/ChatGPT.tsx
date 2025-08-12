import { useState, useRef, useEffect } from 'react'
import { ChatHistoryManager, ChatSession, Message } from '../lib/chatHistory'
import { useTheme } from '../contexts/ThemeContext'
import FileUpload from './FileUpload'

interface ChatGPTProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChatGPT({ isOpen, onClose }: ChatGPTProps) {
  const { isDarkTheme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я ДЖАРВИС, ваш AI-помощник. Чем могу помочь?',
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [inputText])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'

      // Предотвра��ение зума на мобильных устройствах
      const viewport = document.querySelector('meta[name=viewport]')
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      }

      // Дополнительная защита от зума
      document.documentElement.style.webkitTextSizeAdjust = '100%'
      document.documentElement.style.textSizeAdjust = '100%'
      document.body.style.webkitTextSizeAdjust = '100%'
      document.body.style.textSizeAdjust = '100%'

    } else {
      document.body.style.overflow = 'unset'

      // Восстанавливаем оригинальные настройки
      document.documentElement.style.webkitTextSizeAdjust = ''
      document.documentElement.style.textSizeAdjust = ''
      document.body.style.webkitTextSizeAdjust = ''
      document.body.style.textSizeAdjust = ''
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.documentElement.style.webkitTextSizeAdjust = ''
      document.documentElement.style.textSizeAdjust = ''
      document.body.style.webkitTextSizeAdjust = ''
      document.body.style.textSizeAdjust = ''
    }
  }, [isOpen])

  const generateJarvisResponse = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    try {
      const apiMessages = conversationHistory
        .filter(msg => msg.text !== 'Привет! Я ДЖАРВИС, ваш AI-помощник. Чем могу помочь?')
        .map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }))

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
      return '�� готов помочь! Попробуйте ещё раз, задав ваш вопрос. Если проблема повторится - задавайте вопросы прямо здесь в чате! 🚀'
    }
  }

  const handleFileAnalyzed = (analysis: string) => {
    const fileMessage: Message = {
      id: Date.now().toString(),
      text: analysis,
      isUser: false,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, fileMessage])
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
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputText('')
    setIsTyping(true)

    try {
      const aiText = await generateJarvisResponse(currentInput, updatedMessages)
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date()
      }
      
      const finalMessages = [...updatedMessages, aiResponse]
      setMessages(finalMessages)
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка. Попробуйте еще раз.',
        isUser: false,
        timestamp: new Date()
      }
      
      const finalMessages = [...updatedMessages, errorResponse]
      setMessages(finalMessages)
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
    <div className="chatgpt-overlay">
      <div className="chatgpt-container">
        {/* Header */}
        <div className="chatgpt-header">
          <div className="header-content">
            <div className="chatgpt-logo">
              <div className="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="title-info">
                <h3>ДЖАРВИС</h3>
                <div className="status-indicator">
                  <div className="status-dot"></div>
                  В сет��
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatgpt-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
            >
              {!message.isUser && (
                <div className="message-avatar">
                  <div className="ai-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
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
                <div className="ai-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
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

        {/* File Upload */}
        <div className="chatgpt-file-area">
          <FileUpload
            onFileAnalyzed={handleFileAnalyzed}
            disabled={isTyping}
          />
        </div>

        {/* Input */}
        <div className="chatgpt-input-area">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение ДЖАРВИСУ"
              className="chatgpt-input"
              rows={1}
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="send-btn"
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
        .chatgpt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #ffffff;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          /* Предотвращение зума на мобильных */
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
          touch-action: manipulation;
        }

        .chatgpt-container {
          width: 100%;
          height: 100vh;
          background: #ffffff;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: none;
        }

        .chatgpt-header {
          padding: 16px 20px;
          background: #f7f7f8;
          border-bottom: 1px solid #e5e5e7;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chatgpt-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
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

        .close-btn {
          background: none;
          border: none;
          color: #656d76;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #e7e7e9;
          color: #0d1117;
        }

        .chatgpt-messages {
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
        }

        .ai-icon {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
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
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
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

        .chatgpt-file-area {
          padding: 16px 24px 0;
          background: #f7f7f8;
        }

        .chatgpt-input-area {
          padding: 16px 24px 24px;
          background: #f7f7f8;
          border-top: 1px solid #e5e5e7;
        }

        .input-container {
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

        .input-container:focus-within {
          border-color: #0066cc;
          box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .chatgpt-input {
          flex: 1;
          border: none;
          background: transparent;
          resize: none;
          outline: none;
          font-size: 16px;
          line-height: 1.5;
          max-height: 120px;
          min-height: 24px;
          color: #0d1117;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          transform: translateZ(0);
          -webkit-appearance: none;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: default;
          /* Предотвращение зума на iOS */
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
          zoom: 1;
        }

        .chatgpt-input::placeholder {
          color: #8e8ea0;
        }

        .chatgpt-input:disabled {
          color: #8e8ea0;
        }

        .send-btn {
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

        .send-btn:hover:not(:disabled) {
          background: #0052a3;
          transform: translateY(-1px);
        }

        .send-btn:disabled {
          background: #d0d7de;
          color: #8e8ea0;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .chatgpt-overlay {
            padding: 0;
            touch-action: manipulation;
          }

          .chatgpt-container {
            height: 100vh;
            max-width: 100%;
            border-radius: 0;
            position: fixed;
            overflow: hidden;
          }

          .chatgpt-header {
            padding: 16px 20px;
          }

          .chatgpt-messages {
            padding: 20px 16px;
            height: calc(100vh - 180px);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .chatgpt-file-area {
            padding: 12px 20px 0;
          }

          .chatgpt-input-area {
            padding: 12px 20px 16px;
            position: relative;
            background: #f7f7f8;
          }

          .input-container {
            position: relative;
          }

          .chatgpt-input {
            font-size: 16px !important;
            transform: translateZ(0);
            -webkit-appearance: none;
            -webkit-user-select: text;
            touch-action: manipulation;
            -webkit-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
            zoom: 1 !important;
            -webkit-transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000;
          }

          .message {
            max-width: 85%;
          }

          /* Предотвращаем зум при фоку��е на input */
          input, textarea, select {
            font-size: 16px !important;
            transform: translateZ(0);
            -webkit-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
            zoom: 1 !important;
          }

          /* Предотвращение зума на всем контейнере чата */
          .chatgpt-container * {
            -webkit-text-size-adjust: 100% !important;
            text-size-adjust: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}
