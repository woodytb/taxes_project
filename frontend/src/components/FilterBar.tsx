interface Filters {
  search: string
  registerType: string
  hasProkura: boolean
  hasVorstand: boolean
  onlyAttention: boolean
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  totalCount: number
  filteredCount: number
  attentionCount: number
}

export type { Filters }

export default function FilterBar({ filters, onChange, totalCount, filteredCount, attentionCount }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch })
  const isFiltered = filters.search || filters.registerType || filters.hasVorstand || filters.hasProkura || filters.onlyAttention

  return (
    <div className="mb-4 p-4 bg-white/60 rounded-xl border border-cream-dark flex flex-wrap gap-3 items-center">
      {/* Text search */}
      <div className="relative flex-1 min-w-48">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/30"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Firma oder Sitz suchen..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="w-full pl-9 pr-3 py-2 text-sm border border-cream-dark rounded-lg bg-white text-navy placeholder-navy/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
        />
      </div>

      {/* Register type */}
      <select
        value={filters.registerType}
        onChange={(e) => set({ registerType: e.target.value })}
        className="px-3 py-2 text-sm border border-cream-dark rounded-lg bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
      >
        <option value="">Alle Registerarten</option>
        <option value="HRB">HRB – Kapitalgesellschaften</option>
        <option value="HRA">HRA – Personengesellschaften</option>
        <option value="GnR">GnR – Genossenschaften</option>
      </select>

      {/* Standard checkboxes */}
      <label className="flex items-center gap-2 text-sm text-navy cursor-pointer select-none">
        <input type="checkbox" checked={filters.hasVorstand}
          onChange={(e) => set({ hasVorstand: e.target.checked })}
          className="accent-gold w-4 h-4" />
        Hat Geschäftsführung
      </label>

      <label className="flex items-center gap-2 text-sm text-navy cursor-pointer select-none">
        <input type="checkbox" checked={filters.hasProkura}
          onChange={(e) => set({ hasProkura: e.target.checked })}
          className="accent-gold w-4 h-4" />
        Hat Prokura
      </label>

      {/* Attention filter — prominent button style */}
      <button
        onClick={() => set({ onlyAttention: !filters.onlyAttention })}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
          filters.onlyAttention
            ? 'bg-green-600 text-white border-green-600'
            : 'bg-white text-green-700 border-green-400 hover:bg-green-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        Keine Nachfolge
        {attentionCount > 0 && (
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
            filters.onlyAttention ? 'bg-white text-green-700' : 'bg-green-100 text-green-800'
          }`}>
            {attentionCount}
          </span>
        )}
      </button>

      {/* Count + reset */}
      <div className="ml-auto flex items-center gap-3">
        {isFiltered && (
          <>
            <span className="text-xs text-navy/50">{filteredCount} von {totalCount}</span>
            <button
              onClick={() => onChange({ search: '', registerType: '', hasProkura: false, hasVorstand: false, onlyAttention: false })}
              className="text-xs text-gold hover:text-gold-hover font-medium transition-colors"
            >
              Zurücksetzen
            </button>
          </>
        )}
      </div>
    </div>
  )
}
