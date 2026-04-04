import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

interface BloodRequest {
  id: string
  blood_type: string
  units_needed: number
  urgency: string
  status: string
  patient_name: string | null
  patient_file_no: string | null
  notes: string | null
  created_at: string
}

const STATUS_OPTIONS = ['open', 'in_progress', 'fulfilled', 'closed']

export default function Requests() {
  const { t } = useLanguage()
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    const { data, error } = await supabase
      .from('blood_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setRequests(data)
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from('blood_requests')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
      )
    }
  }

  const urgencyColors: Record<string, string> = {
    normal: 'bg-secondary/10 text-secondary',
    urgent: 'bg-primary/10 text-primary',
    critical: 'bg-error text-on-error',
  }

  const statusColors: Record<string, string> = {
    open: 'bg-primary-fixed text-primary',
    in_progress: 'bg-secondary-fixed text-secondary',
    fulfilled: 'bg-tertiary-container/10 text-tertiary-container',
    closed: 'bg-outline/10 text-outline',
  }

  return (
    <div>
      <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
        {t('submittedRequests')}
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        {t('submittedRequestsDesc')}
      </p>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">{t('loading')}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">
            list_alt
          </span>
          <p className="font-headline font-bold text-xl text-on-surface-variant/50">
            {t('noRequestsYet')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-headline font-extrabold text-2xl text-primary">
                    {req.blood_type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${urgencyColors[req.urgency]}`}>
                    {t(`urgency_${req.urgency}`)}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    {req.units_needed} {req.units_needed === 1 ? t('unitNeeded') : t('unitsNeededPlural')}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[req.status]}`}>
                  {t(`reqStatus_${req.status}`)}
                </span>
              </div>

              {(req.patient_name || req.notes) && (
                <div className="text-sm text-on-surface-variant mb-3">
                  {req.patient_name && <span>{t('patient')} {req.patient_name}</span>}
                  {req.patient_file_no && <span> (#{req.patient_file_no})</span>}
                  {req.notes && <p className="mt-1 italic">{req.notes}</p>}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant mr-2">{t('updateStatus')}</span>
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(req.id, status)}
                    disabled={req.status === status}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      req.status === status
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    } disabled:cursor-default`}
                  >
                    {t(`reqStatus_${status}`)}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-on-surface-variant/40 mt-3">
                {t('created')} {new Date(req.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
