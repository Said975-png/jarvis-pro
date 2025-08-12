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
          Спасибо за ��братную связь! 🙏
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
                <path d="M7 10V12C7 13.1046 7.89543 14 9 14H11V20C11 21.1046 11.8954 22 13 22H14C14.5523 22 15 21.5477 15 21V14.5L19.4142 10.0858C19.7895 9.71047 20.0962 9.26611 20.3193 8.77753L21.3193 6.77753C21.7689 5.82423 21.0931 4.75016 20.0481 4.75016H14.8284C14.298 4.75016 13.7893 4.53905 13.4142 4.16394L13 3.75016V2.00016C13 0.895874 12.1046 0.000158997 11 0.000158997C9.89543 0.000158997 9 0.895874 9 2.00016V6.00016L7 8.00016V10Z" fill="currentColor"/>
              </svg>
            </button>
            <button
              onClick={() => handleRating('negative')}
              disabled={isSubmitting}
              className={`feedback-btn negative ${rating === 'negative' ? 'selected' : ''}`}
              title="Нет, не полезно"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M17 14V12C17 10.8954 16.1046 10 15 10H13V4C13 2.89543 12.1046 2 11 2H10C9.44772 2 9 2.44772 9 3V9.5L4.58579 13.9142C4.21047 14.2895 3.90379 14.7339 3.68069 15.2225L2.68069 17.2225C2.23106 18.1758 2.90688 19.2498 3.95188 19.2498H9.17157C9.70201 19.2498 10.2107 19.461 10.5858 19.8361L11 20.2498V21.9998C11 23.1041 11.8954 23.9998 13 23.9998C14.1046 23.9998 15 23.1041 15 21.9998V17.9998L17 15.9998V14Z" fill="currentColor"/>
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
