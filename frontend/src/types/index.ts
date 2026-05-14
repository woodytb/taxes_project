export interface Person {
  id: number
  role: 'vorstand' | 'prokura'
  last_name: string
  first_name: string
  city: string
  birth_date: string | null
  age: number | null
}

export interface AttentionPerson {
  title: string
  first_name: string
  last_name: string
  age: number
}

export interface Company {
  id: number
  firma: string
  sitz: string
  gegenstand: string
  source_file: string
  extracted_at: string | null
  management_count: number
  prokura_count: number
  needs_attention: boolean
  attention_person: AttentionPerson | null
}

export interface CompanyDetail extends Company {
  persons: Person[]
}

export interface ProgressMessage {
  status: 'started' | 'processing' | 'file_done' | 'done' | 'error' | 'timeout' | 'not_found'
  file?: string
  firma?: string
  progress?: number
  total?: number
  processed?: number
  skipped?: number
  detail?: string
}
