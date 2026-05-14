import type { ProgressMessage } from '../types'

interface Props {
  progress: ProgressMessage | null
}

export default function ProgressBar({ progress }: Props) {
  if (!progress) return null

  const percent =
    progress.total && progress.total > 0
      ? Math.round(((progress.progress ?? 0) / progress.total) * 100)
      : 0

  const isDone = progress.status === 'done'
  const isError = progress.status === 'error'

  return (
    <div className="mt-4 p-4 bg-navy rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-cream text-sm font-medium">
          {isDone
            ? `Fertig! ${progress.processed ?? 0} verarbeitet${(progress.skipped ?? 0) > 0 ? `, ${progress.skipped} übersprungen` : ''}`
            : isError
            ? `Fehler: ${progress.detail}`
            : progress.status === 'file_done' && progress.firma
            ? `Extrahiert: ${progress.firma}`
            : progress.file
            ? `Verarbeite: ${progress.file}`
            : 'Starte...'}
        </span>
        <span className="text-gold text-sm font-semibold">
          {isDone ? '100%' : `${percent}%`}
        </span>
      </div>
      <div className="w-full bg-navy-dark rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            isError ? 'bg-red-400' : 'bg-gold'
          }`}
          style={{ width: isDone ? '100%' : `${percent}%` }}
        />
      </div>
      {!isDone && !isError && progress.total != null && (
        <p className="text-cream/50 text-xs mt-2">
          {progress.progress ?? 0} von {progress.total} Dateien
        </p>
      )}
    </div>
  )
}
