import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCompanies, deleteAllCompanies } from './api/client'
import { buildBulkMailto, openBulkMailto } from './utils/email'
import Header from './components/Header'
import ProcessButton from './components/ProcessButton'
import CompanyTable from './components/CompanyTable'
import FilterBar, { type Filters } from './components/FilterBar'
import type { Company } from './types'

const DEFAULT_FILTERS: Filters = {
  search: '',
  registerType: '',
  hasProkura: false,
  hasVorstand: false,
  onlyAttention: false,
}

function getRegisterType(sourceFile: string): string {
  const match = sourceFile.match(/_(HRB|HRA|GnR)_/i)
  return match ? match[1].toUpperCase() : ''
}

export default function App() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)

  const loadCompanies = useCallback(async () => {
    try {
      const data = await fetchCompanies()
      setCompanies(data)
    } catch {
      // Backend may not be ready yet on first load
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  // Fallback: reload table 2s after processing finishes
  useEffect(() => {
    if (!isProcessing) {
      const t = setTimeout(loadCompanies, 2000)
      return () => clearTimeout(t)
    }
  }, [isProcessing, loadCompanies])

  const attentionCompanies = useMemo(
    () => companies.filter((c) => c.needs_attention),
    [companies]
  )

  const filteredCompanies = useMemo(() => {
    const q = filters.search.toLowerCase()
    return companies.filter((c) => {
      if (q && !c.firma.toLowerCase().includes(q) && !c.sitz.toLowerCase().includes(q))
        return false
      if (filters.registerType && getRegisterType(c.source_file) !== filters.registerType)
        return false
      if (filters.hasVorstand && c.management_count === 0) return false
      if (filters.hasProkura && c.prokura_count === 0) return false
      if (filters.onlyAttention && !c.needs_attention) return false
      return true
    })
  }, [companies, filters])

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-navy">Registereinträge</h2>
            <p className="text-navy/50 text-sm mt-0.5">
              Extrahierte Daten aus Handelsregister-PDFs
            </p>
          </div>
          <div className="flex items-center gap-3">
            {companies.length > 0 && (
              <button
                onClick={async () => {
                  if (!confirm('Alle Daten löschen?')) return
                  setIsClearing(true)
                  await deleteAllCompanies()
                  setCompanies([])
                  setIsClearing(false)
                }}
                disabled={isClearing || isProcessing}
                className="flex items-center gap-2 px-4 py-2.5 rounded bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isClearing ? 'Löschen...' : 'Daten löschen'}
              </button>
            )}
            {attentionCompanies.length > 0 && (
              <button
                onClick={() => openBulkMailto(attentionCompanies)}
                className="flex items-center gap-2 px-4 py-2.5 rounded bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Alle anschreiben ({attentionCompanies.length})
              </button>
            )}
            <ProcessButton
              onComplete={loadCompanies}
              onFileDone={loadCompanies}
              onProcessingChange={setIsProcessing}
            />
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          totalCount={companies.length}
          filteredCount={filteredCompanies.length}
          attentionCount={attentionCompanies.length}
        />

        <CompanyTable companies={filteredCompanies} loading={loading} />
      </main>
    </div>
  )
}
