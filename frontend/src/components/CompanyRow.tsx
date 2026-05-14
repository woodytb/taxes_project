import { useState } from 'react'
import { fetchCompany } from '../api/client'
import { openMailto } from '../utils/email'
import type { Company, CompanyDetail, Person } from '../types'

interface Props {
  company: Company
}

function isProkura(role: string) {
  return role.toLowerCase().includes('prokur')
}

function PersonTable({ persons }: { persons: Person[] }) {
  const management = persons.filter((p) => !isProkura(p.role))
  const prokura = persons.filter((p) => isProkura(p.role))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {management.length > 0 && <PersonGroup persons={management} />}
      {prokura.length > 0 && <PersonGroup persons={prokura} />}
    </div>
  )
}

function PersonGroup({ persons }: { persons: Person[] }) {
  const byTitle = persons.reduce<Record<string, Person[]>>((acc, p) => {
    const key = p.role || 'Unbekannt'
    ;(acc[key] = acc[key] || []).push(p)
    return acc
  }, {})

  return (
    <>
      {Object.entries(byTitle).map(([title, group]) => (
        <div key={title}>
          <h4 className="text-xs font-bold uppercase tracking-widest text-navy/50 mb-2">{title}</h4>
          <div className="space-y-2">
            {group.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between bg-cream rounded px-3 py-2 border-l-2 border-gold"
              >
                <div>
                  <span className="font-semibold text-navy text-sm">
                    {p.last_name}, {p.first_name}
                  </span>
                  {p.city && <span className="text-navy/60 text-xs ml-2">{p.city}</span>}
                  {p.birth_date && (
                    <div className="text-navy/50 text-xs mt-0.5">
                      *{new Date(p.birth_date).toLocaleDateString('de-DE')}
                    </div>
                  )}
                </div>
                {p.age != null && (
                  <span className="ml-4 text-sm font-bold text-gold whitespace-nowrap">
                    {p.age} J.
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function MailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

export default function CompanyRow({ company }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [detail, setDetail] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(false)

  const { needs_attention } = company

  const toggle = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button[data-email]')) return
    if (!expanded && !detail) {
      setLoading(true)
      try {
        const d = await fetchCompany(company.id)
        setDetail(d)
      } finally {
        setLoading(false)
      }
    }
    setExpanded((v) => !v)
  }

  const openEmail = (e: React.MouseEvent) => {
    e.stopPropagation()
    openMailto(company)
  }

  const formattedDate = company.extracted_at
    ? new Date(company.extracted_at).toLocaleDateString('de-DE')
    : '—'

  const rowBg = needs_attention
    ? 'bg-green-50 hover:bg-green-100/80 border-l-4 border-l-green-500'
    : 'hover:bg-cream-dark/60'

  return (
    <>
      <tr
        className={`border-b border-cream-dark cursor-pointer transition-colors ${rowBg}`}
        onClick={toggle}
      >
        <td className="table-cell">
          <div className="flex items-center gap-2">
            {needs_attention && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-300 whitespace-nowrap">
                Keine Nachfolge
              </span>
            )}
            <span className="font-semibold text-navy">{company.firma}</span>
          </div>
        </td>
        <td className="table-cell text-navy/70">{company.sitz || '—'}</td>
        <td className="table-cell">
          <span className="badge-vorstand">{company.management_count}</span>
        </td>
        <td className="table-cell">
          <span className="badge-prokura">{company.prokura_count}</span>
        </td>
        <td className="table-cell text-navy/50 text-xs">{formattedDate}</td>
        <td className="table-cell text-right">
          <div className="flex items-center justify-end gap-2">
            {needs_attention && company.attention_person && (
              <button
                data-email="true"
                onClick={openEmail}
                title={`E-Mail an ${company.firma}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <MailIcon />
                E-Mail
              </button>
            )}
            <svg
              className={`w-4 h-4 text-gold inline-block transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className={needs_attention ? 'bg-green-50/50' : 'bg-cream-dark/30'}>
          <td colSpan={6} className="px-6 py-2">
            {needs_attention && company.attention_person && (
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <span className="text-green-700 text-xs font-semibold">
                  Hinweis: {company.attention_person.title} {company.attention_person.first_name} {company.attention_person.last_name} ({company.attention_person.age} Jahre) ist alleinige Vertretungsperson ohne Prokura.
                </span>
              </div>
            )}
            {loading ? (
              <p className="text-navy/50 text-sm py-4 text-center">Lade Details...</p>
            ) : detail ? (
              <div>
                {detail.gegenstand && (
                  <p className="text-navy/70 text-sm italic border-b border-cream-dark pb-3 mb-3 px-4 pt-2">
                    {detail.gegenstand}
                  </p>
                )}
                <PersonTable persons={detail.persons} />
              </div>
            ) : null}
          </td>
        </tr>
      )}
    </>
  )
}
