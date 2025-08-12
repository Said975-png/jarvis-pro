import { useState, useRef, useEffect } from 'react'

interface VoiceRecordingHook {
  isRecording: boolean
  isSupported: boolean
  transcript: string
  error: string | null
  startRecording: () => void
  stopRecording: () => void
  clearTranscript: () => void
}

export const useVoiceRecording = (): VoiceRecordingHook => {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Проверяем поддержку Web Speech API
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ru-RU'
      
      recognition.onstart = () => {
        setIsRecording(true)
        setError(null)
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart
          } else {
            interimTranscript += transcriptPart
          }
        }
        
        setTranscript(finalTranscript + interimTranscript)
        
        // Автоматически останавливаем запись через 5 секунд тишины
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          if (recognition && isRecording) {
            recognition.stop()
          }
        }, 5000)
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        
        switch (event.error) {
          case 'no-speech':
            setError('Речь не обнаружена. Попробуйте еще раз.')
            break
          case 'audio-capture':
            setError('Микрофон недоступен. Проверьте разрешения.')
            break
          case 'not-allowed':
            setError('Доступ к микрофону запрещен. Разрешите использование микрофона.')
            break
          case 'network':
            setError('Ошибка сети. Проверьте подключение к интернету.')
            break
          default:
            setError('Ошибка распознавания речи. Попробуйте еще раз.')
        }
      }
      
      recognition.onend = () => {
        setIsRecording(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
      
      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      setError('Ваш браузер не поддерживает распознавание речи.')
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isRecording])

  const startRecording = () => {
    if (!isSupported || !recognitionRef.current) {
      setError('Распознавание речи недоступно.')
      return
    }
    
    setTranscript('')
    setError(null)
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
      setError('Не удалось начать запись. Попробуйте еще раз.')
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setError(null)
  }

  return {
    isRecording,
    isSupported,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript
  }
}
