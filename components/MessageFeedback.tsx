import { useState } from 'react'

interface MessageFeedbackProps {
  interactionId: string
  onFeedbackSent?: (rating: 'positive' | 'negative') => void
}

export default function MessageFeedback({ interactionId, onFeedbackSent }: MessageFeedbackProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleRating = async (newRating: 'positive' | 'negative') => {
    if (submitted) return

    setRating(newRating)
    
    if (newRating === 'negative') {
      setShowComment(true)
      return
    }

    await submitFeedback(newRating)
  }

  const submitFeedback = async (finalRating: 'positive' | 'negative', finalComment?: string) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_feedback',
          interactionId,
          rating: finalRating,
          comment: finalComment || comment
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmitted(true)
        onFeedbackSent?.(finalRating)
        console.log('Feedback sent successfully')
      } else {
        console.error('Failed to send feedback:', data.error)
      }
    } catch (error) {
      console.error('Error sending feedback:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (rating) {
      await submitFeedback(rating, comment)
      setShowComment(false)
    }
  }

  const handleCommentCancel = () => {
    setShowComment(false)
    setComment('')
    setRating(null)
  }

  if (submitted) {
    return (
      <div className="message-feedback submitted">
        <span className="feedback-thanks">
          Спасибо за обратную связь!
        </span>
      </div>
    )
  }

  return (
    <div className="message-feedback">
      {!showComment ? (
        <div className="feedback-buttons">
          <span className="feedback-question">Этот ответ был полезным?</span>
          <div className="rating-buttons">
            <button
              onClick={() => handleRating('positive')}
              disabled={isSubmitting}
              className={`feedback-btn positive ${rating === 'positive' ? 'selected' : ''}`}
              title="Да, полезно"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M8 12L3 7L4.4 5.6L8 9.2L19.6 -2.4L21 -1L8 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 9L9 4L10.4 2.6L14 6.2L25.6 -5.4L27 -4L14 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => handleRating('negative')}
              disabled={isSubmitting}
              className={`feedback-btn negative ${rating === 'negative' ? 'selected' : ''}`}
              title="Нет, не полезно"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="feedback-comment">
          <div className="comment-header">
            <span>Помогите ДЖАРВИС стать лучше:</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Что можно улучшить в этом ответе?"
            className="comment-textarea"
            rows={3}
          />
          <div className="comment-actions">
            <button
              onClick={handleCommentSubmit}
              disabled={isSubmitting}
              className="comment-submit"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
            <button
              onClick={handleCommentCancel}
              disabled={isSubmitting}
              className="comment-cancel"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
