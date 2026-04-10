import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  is_walkin: boolean
  ticket_code: string | null
  donors: {
    blood_type: string
    gender: string
    users: {
      first_name: string
      last_name: string
      phone: string
    }
  }
}

type SortOption = 'newest' | 'oldest' | 'status'

export default function Appointments() {
  const { t } = useLanguage()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const [sort, setSort] = useState<SortOption>('newest')

  useEffect(() => {
    loadAppointments()
  }, [])

  async function loadAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, appointment_date, appointment_time, status, is_walkin, ticket_code,
        donors (
          blood_type, gender,
          users:user_id ( first_name, last_name, phone )
        )
      `)
      .order('appointment_date', { ascending: false })

    if (!error && data) {
      setAppointments(data as unknown as Appointment[])
    }
    setLoading(false)
  }

  async function clearCancelled() {
    const cancelledCount = appointments.filter(a => a.status === 'cancelled').length
    if (cancelledCount === 0) return
    setClearing(true)
    // Optimistic update — remove from UI immediately
    setAppointments(prev => prev.filter(a => a.status !== 'cancelled'))
    // RPC is SECURITY DEFINER — bypasses RLS. Trust it.
    const { error } = await supabase.rpc('delete_cancelled_appointments')
    if (error) {
      console.error('Clear cancelled failed:', error.message)
    }
    setClearing(false)
  }

  const sorted = [...appointments].sort((a, b) => {
    if (sort === 'newest') return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
    if (sort === 'oldest') return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
    const priority: Record<string, number> = { booked: 0, completed: 1, no_show: 2, cancelled: 3 }
    return (priority[a.status] ?? 9) - (priority[b.status] ?? 9)
  })

  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length

  const statusColors: Record<string, string> = {
    booked: 'bg-secondary/10 text-secondary',
    completed: 'bg-tertiary-container/10 text-tertiary-container',
    cancelled: 'bg-error-container/20 text-error',
    no_show: 'bg-outline/10 text-outline',
  }

  const statusIcons: Record<string, string> = {
    booked: 'event_available',
    completed: 'check_circle',
    cancelled: 'cancel',
    no_show: 'person_off',
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
            {t('donorAppointments')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-0.5">
            {t('donorAppointmentsDesc')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortOption)}
              className="appearance-none bg-surface-container-low border border-outline rounded-xl pl-3 pr-8 py-2 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="newest">{t('mostRecent')}</option>
              <option value="oldest">{t('oldestFirst')}</option>
              <option value="status">{t('byStatus')}</option>
            </select>
            <span
              className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
              style={{ fontSize: '16px' }}
            >
              expand_more
            </span>
          </div>

          {cancelledCount > 0 && (
            <button
              onClick={clearCancelled}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error text-sm font-semibold transition-all duration-150 border border-error/20 cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete_sweep</span>
              {clearing ? t('clearing') : `${t('clearCancelledBtn')} (${cancelledCount})`}
            </button>
          )}
        </div>
      </div>

      {!loading && appointments.length > 0 && (
        <div className="flex gap-2 mt-4 mb-6 flex-wrap">
          {(['booked', 'completed', 'cancelled', 'no_show'] as const).map(s => {
            const count = appointments.filter(a => a.status === s).length
            if (count === 0) return null
            return (
              <span
                key={s}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                  sort === 'status' && s === 'cancelled' ? 'border-error/30' : 'border-transparent'
                } ${statusColors[s]}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>
                  {statusIcons[s]}
                </span>
                {count} {t(`status_${s}`)}
              </span>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-surface-container rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 block">
            calendar_today
          </span>
          <p className="font-headline font-bold text-xl text-on-surface-variant/50">
            {t('noAppointmentsYet')}
          </p>
          <p className="text-sm text-on-surface-variant/40 mt-1">
            {t('noAppointmentsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(apt => (
            <div
              key={apt.id}
              className={`bg-surface-container-lowest p-5 rounded-2xl border flex items-center gap-4 transition-all duration-150 ${
                apt.status === 'cancelled'
                  ? 'border-error/15 opacity-60'
                  : 'border-outline hover:border-outline-variant'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                apt.status === 'cancelled' ? 'bg-error/10' : 'bg-primary/10'
              }`}>
                <span
                  className={`material-symbols-outlined text-2xl ${apt.status === 'cancelled' ? 'text-error' : 'text-primary'}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  person
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline font-bold text-on-surface truncate">
                  {apt.donors?.users?.first_name} {apt.donors?.users?.last_name}
                </h3>
                <p className="text-sm text-on-surface-variant truncate">
                  {apt.donors?.blood_type} &middot; {apt.appointment_date} at {apt.appointment_time}
                  {apt.is_walkin && ` (${t('walkIn')})`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {apt.ticket_code && (
                  <span className="text-xs font-mono bg-surface-container-low px-2 py-1 rounded-lg text-on-surface-variant">
                    {apt.ticket_code}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusColors[apt.status] || ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>
                    {statusIcons[apt.status] || 'circle'}
                  </span>
                  {t(`status_${apt.status}`)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
