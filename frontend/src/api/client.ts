import axios from 'axios'
import type { Company, CompanyDetail } from '../types'

const api = axios.create({ baseURL: '/api' })

export async function triggerProcessing(): Promise<{ task_id: string }> {
  const { data } = await api.post('/process')
  return data
}

export async function fetchCompanies(): Promise<Company[]> {
  const { data } = await api.get('/companies')
  return data
}

export async function fetchCompany(id: number): Promise<CompanyDetail> {
  const { data } = await api.get(`/companies/${id}`)
  return data
}

export async function deleteAllCompanies(): Promise<void> {
  await api.delete('/companies')
}

export async function fetchHealth(): Promise<{ status: string; db: boolean; ollama: boolean }> {
  const { data } = await api.get('/health')
  return data
}
