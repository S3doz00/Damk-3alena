import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import ProgressBar from '../components/ui/progress-bar'

interface Campaign {
  id: string
  title: string
  description: string | null
  campaign_date: string
  start_time: string
  end_time: string
  blood_types_needed: string[]
  urgency: string
  target_donors: number
  registered_donors: number
  is_active: boolean
  facilities?: { name: string; city: string } | null
}

const URGENCY_STYLES: Record<string, string> = {
  critical: 'bg-error/10 text-error border border-error/20',
  high: 'bg-primary/10 text-primary border border-primary/20',
  medium: 'bg-secondary/10 text-secondary border border-secondary/20',
}

export default function Campaigns() {
  const { t } = useLanguage()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('active')

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    setLoading(true)
    const { data } = await supabase
      .from('campaigns')
      .select('*, facilities(name, city)')
      .order('campaign_date', { ascending: false })
    if (data) setCampaigns(data as Campaign[])
    setLoading(false)
  }

  const today = new Date().toISOString().slice(0, 10)
  const filtered = campaigns.filter(c => {
    if (filter === 'active') return c.is_active && c.campaign_date >= today
    if (filter === 'past') return !c.is_active || c.campaign_date < today
    return true
  })

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
            {t('campaigns')}
          </h1>
          <p className="text-on-surface-variant text-sm">{t('campaignsListDesc')}</p>
        </div>
        <Link
          to="/campaigns/new"
          className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-3 px-5 rounded-xl shadow-[0_8px_24px_rgba(141,0,41,0.15)] hover:shadow-[0_12px_32px_rgba(141,0,41,0.25)] active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add</span>
          {t('newCampaign')}
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['active', 'past', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === f
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {t(`filter_${f}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-3">campaign</span>
          <p className="text-on-surface-variant font-medium">{t('noCampaigns')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(c => {
            const complete = c.registered_donors >= c.target_donors
            return (
              <div
                key={c.id}
                className="bg-surface-container-low rounded-2xl p-5 hover:shadow-lg transition-shadow border border-outline/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${URGENCY_STYLES[c.urgency] || URGENCY_STYLES.medium}`}>
                    {t(`urgency_${c.urgency}`)}
                  </span>
                  {complete && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-secondary/15 text-secondary border border-secondary/20">
                      {t('completed')}
                    </span>
                  )}
                </div>

                <h3 className="font-headline font-bold text-lg text-on-surface mb-1 line-clamp-1">{c.title}</h3>
                <p className="text-xs text-on-surface-variant mb-4">
                  {c.facilities?.name || ''} {c.facilities?.city && `— ${c.facilities.city}`}
                </p>

                <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-4">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {c.campaign_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {c.start_time.slice(0, 5)}–{c.end_time.slice(0, 5)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {c.blood_types_needed.map(bt => (
                    <span key={bt} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                      {bt}
                    </span>
                  ))}
                </div>

                <ProgressBar
                  current={c.registered_donors}
                  target={c.target_donors}
                  label={t('progress')}
                  unit={t('donorsUnit')}
                  tone={c.urgency === 'critical' ? 'error' : 'primary'}
                  compact
                />

                <div className="flex gap-2 mt-4 pt-4 border-t border-outline/10">
                  <Link
                    to={`/campaigns/${c.id}/edit`}
                    className="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface font-semibold text-xs uppercase tracking-wider hover:bg-surface-container-high transition flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    {t('edit')}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
