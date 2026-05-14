import { useState } from 'react'
import { triggerProcessing } from '../api/client'
import { useProgress } from '../hooks/useProgress'
import ProgressBar from './ProgressBar'
import type { ProgressMessage } from '../types'

interface Props {
  onComplete: () => void
  onFileDone?: () => void
  onProcessingChange?: (processing: boolean) => void
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export default function ProcessButton({ onComplete, onFileDone, onProcessingChange }: Props) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDone = (msg: ProgressMessage) => {
    setIsProcessing(false)
    onProcessingChange?.(false)
    if (msg.status === 'done') {
      onComplete()
    }
  }

  const { progress } = useProgress(taskId, { onDone: handleDone, onFileDone })

  const handleClick = async () => {
    try {
      setError(null)
      setIsProcessing(true)
      onProcessingChange?.(true)
      setTaskId(null)
      const { task_id } = await triggerProcessing()
      setTaskId(task_id)
    } catch (e: any) {
      setError(e.message ?? 'Unbekannter Fehler')
      setIsProcessing(false)
    }
  }

  const isDone = progress?.status === 'done'

  return (
    <div className="mb-6">
      <div className="flex items-center gap-4">
        <button
          className="btn-gold"
          onClick={handleClick}
          disabled={isProcessing}
        >
          {isProcessing && <Spinner />}
          {isProcessing ? 'Verarbeite PDFs...' : 'PDFs verarbeiten'}
        </button>

        {isDone && (
          <span className="text-sm text-green-700 font-medium">
            Extraktion abgeschlossen
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {(isProcessing || progress) && (
        <ProgressBar progress={progress} />
      )}
    </div>
  )
}
