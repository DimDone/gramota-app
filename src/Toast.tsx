// Всплывающее уведомление в верхнем углу.

import { useEffect } from 'react'
import './Toast.css'

export type ToastMessage = {
  id: number
  text: string
  tone: 'error' | 'success'
}

type ToastProps = {
  message: ToastMessage | null
  onDismiss: () => void
}

const AUTO_HIDE_MS = 4200

export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, AUTO_HIDE_MS)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      className={`toast toast--${message.tone}`}
      role="status"
      aria-live="polite"
    >
      {message.text}
    </div>
  )
}
