import type { Company } from '../types'
import CompanyRow from './CompanyRow'

interface Props {
  companies: Company[]
  loading: boolean
}

export default function CompanyTable({ companies, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="text-navy/50 text-sm">Lade Daten...</div>
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="bg-white/50 rounded-xl border border-cream-dark p-12 text-center">
        <svg className="w-12 h-12 text-navy/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-navy/40 text-sm">
          Noch keine Daten. Klicken Sie auf "PDFs verarbeiten", um Dokumente zu extrahieren.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden shadow-sm border border-cream-dark">
      <table className="w-full border-collapse bg-white">
        <thead>
          <tr>
            <th className="table-header">Firma</th>
            <th className="table-header">Sitz</th>
            <th className="table-header">Geschäftsführung</th>
            <th className="table-header">Prokura</th>
            <th className="table-header">Extrahiert am</th>
            <th className="table-header w-10"></th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company, i) => (
            <CompanyRow
              key={company.id}
              company={company}
            />
          ))}
        </tbody>
      </table>
      <div className="bg-cream-dark/50 px-4 py-2 text-xs text-navy/40 border-t border-cream-dark">
        {companies.length} Einträge
      </div>
    </div>
  )
}
