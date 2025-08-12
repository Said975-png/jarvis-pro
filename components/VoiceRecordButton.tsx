import { useEffect } from 'react'
import { useVoiceRecording } from '../hooks/useVoiceRecording'

interface VoiceRecordButtonProps {
  onTranscript: (text: string) => void
  onRecordingStart?: () => void
  onRecordingStop?: () => void
  onLiveTranscript?: (text: string) => void
  disabled?: boolean
  className?: string
}

export default function VoiceRecordButton({
  onTranscript,
  onRecordingStart,
  onRecordingStop,
  onLiveTranscript,
  disabled = false,
  className = ''
}: VoiceRecordButtonProps) {
  const {
    isRecording,
    isSupported,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript
  } = useVoiceRecording()

  // Отправляем транскрипт родительскому компоненту
  useEffect(() => {
    if (transcript && !isRecording) {
      onTranscript(transcript)
      clearTranscript()
    }
  }, [transcript, isRecording, onTranscript, clearTranscript])

  // Показываем ошибку в консоли (можно добавить уведомления)
  useEffect(() => {
    if (error) {
      console.warn('Voice recording error:', error)
    }
  }, [error])

  const handleClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!isSupported) {
    return null // Не показываем кнопку если браузер не поддерживает
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`voice-record-btn ${isRecording ? 'recording' : ''} ${className}`}
      title={isRecording ? 'Нажмите чтобы остановить запись' : 'Записать голосовое сообщение'}
    >
      {isRecording ? (
        <div className="recording-animation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
          </svg>
          <div className="recording-pulse"></div>
        </div>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C13.1 2 14 2.9 14 4V12C14 13.1 13.1 14 12 14C10.9 14 10 13.1 10 12V4C10 2.9 10.9 2 12 2Z" fill="currentColor"/>
          <path d="M19 10V12C19 15.866 15.866 19 12 19C8.134 19 5 15.866 5 12V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 19V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 22H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )}
    </button>
  )
}
