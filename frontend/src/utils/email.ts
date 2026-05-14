import type { Company } from '../types'

const LEGAL_FORMS = [
  'GmbH & Co. KG', 'GmbH & Co. OHG', 'GmbH & Co. KGaA',
  'GmbH', 'AG', 'KG', 'OHG', 'eG', 'e.G.', 'e.K.', 'e.V.',
  'GbR', 'UG', 'SE', 'KGaA', 'gemeinnützige',
]

function guessEmailDomain(firma: string): string {
  let name = firma
  for (const lf of LEGAL_FORMS) {
    name = name.replace(new RegExp(`\\b${lf.replace('.', '\\.')}\\b`, 'gi'), '')
  }
  name = name
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${name}.de`
}

function buildMailtoUrl(company: Company): string {
  const p = company.attention_person!
  const domain = guessEmailDomain(company.firma)
  const to = `info@${domain}`

  const subject = encodeURIComponent(
    `Anfrage zur Nachfolgeplanung – ${company.firma}`
  )

  const body = encodeURIComponent(
    `Sehr geehrte Damen und Herren,\n\n` +
    `im Rahmen unserer Analyse aktueller Handelsregisterdaten sind wir auf Ihr Unternehmen ` +
    `${company.firma} mit Sitz in ${company.sitz} aufmerksam geworden.\n\n` +
    `Unsere Auswertung zeigt, dass ${p.title} ${p.first_name} ${p.last_name} (${p.age} Jahre) ` +
    `als alleinige Vertretungsperson ohne weitere Prokuristen oder Mitgeschäftsführer ` +
    `im Handelsregister eingetragen ist.\n\n` +
    `Erfahrungsgemäß ist dies ein Zeitpunkt, zu dem sich viele Unternehmen Fragen zur ` +
    `Nachfolgeplanung und zur rechtlichen Absicherung stellen. ` +
    `Wir würden uns freuen, Sie dabei unterstützen zu dürfen.\n\n` +
    `Für ein unverbindliches Erstgespräch stehen wir Ihnen gerne zur Verfügung.\n\n` +
    `Mit freundlichen Grüßen\n`
  )

  return `mailto:${to}?subject=${subject}&body=${body}`
}

function buildBulkMailtoUrl(companies: Company[]): string {
  const attention = companies.filter((c) => c.needs_attention && c.attention_person)
  if (attention.length === 0) return 'mailto:'

  const subject = encodeURIComponent('Anfrage zur Nachfolgeplanung – Handelsregister Auswertung')

  const lines = attention.map((c) => {
    const p = c.attention_person!
    return `• ${c.firma} (${c.sitz}): ${p.title} ${p.first_name} ${p.last_name}, ${p.age} Jahre`
  })

  const body = encodeURIComponent(
    `Sehr geehrte Damen und Herren,\n\n` +
    `im Rahmen unserer Analyse aktueller Handelsregisterdaten haben wir folgende Unternehmen ` +
    `identifiziert, bei denen eine alleinige Vertretungsperson ohne Prokura eingetragen ist:\n\n` +
    lines.join('\n') +
    `\n\nWir würden uns freuen, die betroffenen Unternehmen bei Fragen zur Nachfolgeplanung ` +
    `und rechtlichen Absicherung unterstützen zu dürfen.\n\n` +
    `Mit freundlichen Grüßen\n`
  )

  return `mailto:?subject=${subject}&body=${body}`
}

function triggerMailto(url: string): void {
  const a = document.createElement('a')
  a.href = url
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  setTimeout(() => document.body.removeChild(a), 200)
}

export function openMailto(company: Company): void {
  triggerMailto(buildMailtoUrl(company))
}

export function openBulkMailto(companies: Company[]): void {
  triggerMailto(buildBulkMailtoUrl(companies))
}

// Keep old names as aliases so existing imports don't break
export const buildMailto = buildMailtoUrl
export const buildBulkMailto = buildBulkMailtoUrl
