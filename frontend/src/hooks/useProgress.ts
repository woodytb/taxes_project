import { useEffect, useRef, useState } from 'react'
import type { ProgressMessage } from '../types'

interface UseProgressOptions {
  onDone?: (msg: ProgressMessage) => void
  onFileDone?: (msg: ProgressMessage) => void
}

export function useProgress(taskId: string | null, options: UseProgressOptions = {}) {
  const [progress, setProgress] = useState<ProgressMessage | null>(null)
  const onDoneRef = useRef(options.onDone)

  const onFileDoneRef = useRef(options.onFileDone)

  // Always keep refs pointing to the latest callbacks
  useEffect(() => {
    onDoneRef.current = options.onDone
    onFileDoneRef.current = options.onFileDone
  })

  useEffect(() => {
    if (!taskId) return

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws/progress/${taskId}`)

    ws.onmessage = (event) => {
      const msg: ProgressMessage = JSON.parse(event.data)
      setProgress(msg)
      if (msg.status === 'file_done') {
        onFileDoneRef.current?.(msg)
        // If all files accounted for, synthesize done so button resets
        if (msg.progress != null && msg.total != null && msg.progress >= msg.total) {
          const done: ProgressMessage = { status: 'done', processed: msg.progress, skipped: 0, total: msg.total }
          setProgress(done)
          onDoneRef.current?.(done)
          ws.close()
        }
      } else if (msg.status === 'done' || msg.status === 'error') {
        onDoneRef.current?.(msg)
        ws.close()
      }
    }

    ws.onerror = () => {
      setProgress({ status: 'error', detail: 'WebSocket connection failed' })
      onDoneRef.current?.({ status: 'error', detail: 'WebSocket connection failed' })
    }

    return () => {
      ws.close()
    }
  }, [taskId])

  return { progress }
}
