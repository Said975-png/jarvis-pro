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
  const finalTranscriptRef = useRef('')
  const retryCountRef = useRef(0)
  const maxRetries = 3

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
      recognition.maxAlternatives = 1
      // Более быстрая обработка результатов
      recognition.serviceURI = ''
      
      recognition.onstart = () => {
        setIsRecording(true)
        setError(null)
        finalTranscriptRef.current = ''
        setTranscript('')
        retryCountRef.current = 0 // Сброс счетчика при успешном старте
      }
      
      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        let hasFinalResult = false

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart
            hasFinalResult = true
          } else {
            interimTranscript += transcriptPart
          }
        }

        // Сохраняем финальный транскрипт
        if (hasFinalResult && finalTranscript.trim()) {
          finalTranscriptRef.current += finalTranscript
        }

        const fullTranscript = finalTranscriptRef.current + interimTranscript
        setTranscript(fullTranscript)

        // Очищаем предыдущий таймер
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Если есть финальный результат и достаточно текста, останавливаем быстрее
        if (hasFinalResult && finalTranscript.trim().length > 2) {
          timeoutRef.current = setTimeout(() => {
            if (recognition && isRecording) {
              recognition.stop()
            }
          }, 1200) // 1.2 секунды после финального результата
        }
        // Если только промежуточные результаты, ждем дольше
        else if (interimTranscript.trim().length > 0) {
          timeoutRef.current = setTimeout(() => {
            if (recognition && isRecording) {
              recognition.stop()
            }
          }, 3000) // 3 секунды для промежуточных результатов
        }
        // Если ничего не распознано, ждем дольше для первоначального обнаружения речи
        else {
          timeoutRef.current = setTimeout(() => {
            if (recognition && isRecording) {
              recognition.stop()
            }
          }, 5000) // 5 секунд для ожидания начала речи
        }
      }
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)

        switch (event.error) {
          case 'no-speech':
            // Автоматически перезапускаем при отсутствии речи
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              console.log(`No speech detected, retrying... (${retryCountRef.current}/${maxRetries})`)

              // Небольшая задержка перед перезапуском
              setTimeout(() => {
                if (recognitionRef.current && isRecording) {
                  try {
                    recognitionRef.current.start()
                  } catch (e) {
                    console.error('Error restarting recognition:', e)
                    setIsRecording(false)
                    setError('Не удалось перезапустить запись. Попробуйте еще раз.')
                  }
                }
              }, 500)
            } else {
              setIsRecording(false)
              setError('Речь не обнаружена. Попробуйте говорить громче или ближе к микрофону.')
            }
            break
          case 'audio-capture':
            setIsRecording(false)
            setError('Микрофон недоступен. Проверьте разрешения и подключение.')
            break
          case 'not-allowed':
            setIsRecording(false)
            setError('Доступ к микрофону запрещен. Разрешите использование микрофона в настройках браузера.')
            break
          case 'network':
            setIsRecording(false)
            setError('Ошибка сети. Проверьте подключение к интернету.')
            break
          case 'aborted':
            // Запись была прервана пользователем, не показываем ошибку
            setIsRecording(false)
            break
          default:
            setIsRecording(false)
            setError('Ошибка рас��ознавания речи. Попробуйте еще раз.')
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
    finalTranscriptRef.current = ''
    retryCountRef.current = 0
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
    finalTranscriptRef.current = ''
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
