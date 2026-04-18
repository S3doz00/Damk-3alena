import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const URGENCY_LEVELS = ['medium', 'high', 'critical']

interface FacilityOption {
  id: string
  name: string
  city: string
}

export default function CreateCampaign() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [facilities, setFacilities] = useState<FacilityOption[]>([])
  const [form, setForm] = useState({
    title: '',
    facility_id: '',
    campaign_date: '',
    start_time: '08:00',
    end_time: '16:00',
    target_donors: 50,
    blood_types_needed: [] as string[],
    urgency: 'medium',
    description: '',
  })

  useEffect(() => {
    supabase.from('facilities').select('id, name, city').then(({ data }) => {
      if (data) setFacilities(data)
    })
  }, [])

  const toggleBloodType = (bt: string) => {
    setForm(prev => ({
      ...prev,
      blood_types_needed: prev.blood_types_needed.includes(bt)
        ? prev.blood_types_needed.filter(b => b !== bt)
        : [...prev.blood_types_needed, bt],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { data: userRecord } = await supabase
      .from('users').select('id').eq('auth_id', user.id).single()
    if (!userRecord) { setError('User profile not found'); setLoading(false); return }

    const { data: staffData } = await supabase
      .from('staff').select('id, facility_id').eq('user_id', userRecord.id).single()
    if (!staffData) { setError('Staff profile not found'); setLoading(false); return }

    const { error: insertError } = await supabase
      .from('campaigns')
      .insert({
        title: form.title,
        facility_id: form.facility_id || staffData.facility_id,
        campaign_date: form.campaign_date,
        start_time: form.start_time,
        end_time: form.end_time,
        target_donors: form.target_donors,
        blood_types_needed: form.blood_types_needed,
        urgency: form.urgency,
        description: form.description,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
        {t('createCampaign')}
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        {t('createCampaignDesc')}
      </p>

      {success && (
        <div className="bg-secondary-container/30 text-secondary px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {t('campaignCreated')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Title */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('campaignName')}</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-outline/60"
            placeholder={t('campaignNamePlaceholder')}
          />
        </div>

        {/* Target Facility */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('targetFacility')}</label>
          <select
            value={form.facility_id}
            onChange={(e) => setForm({ ...form, facility_id: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
          >
            <option value="">{t('selectFacility')}</option>
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name} — {f.city}</option>
            ))}
          </select>
        </div>

        {/* Campaign Date + Times */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('startDate')}</label>
            <input
              type="date"
              required
              value={form.campaign_date}
              onChange={(e) => setForm({ ...form, campaign_date: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('startDate')}</label>
            <input
              type="time"
              required
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('endDate')}</label>
            <input
              type="time"
              required
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
        </div>

        {/* Target Donors + Urgency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('targetUnits')}</label>
            <input
              type="number"
              min="1"
              value={form.target_donors}
              onChange={(e) => setForm({ ...form, target_donors: Number(e.target.value) })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('urgencyLevel')}</label>
            <div className="flex gap-2">
              {URGENCY_LEVELS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: level })}
                  className={`flex-1 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${
                    form.urgency === level
                      ? level === 'critical'
                        ? 'bg-error text-on-error'
                        : level === 'high'
                        ? 'bg-primary text-on-primary'
                        : 'bg-secondary text-on-secondary'
                      : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {t(`urgency_${level}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blood Types Needed */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('bloodTypesNeeded')}</label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map(bt => (
              <button
                key={bt}
                type="button"
                onClick={() => toggleBloodType(bt)}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
                  form.blood_types_needed.includes(bt)
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-outline/60 resize-none h-24"
            placeholder={t('campaignDescPlaceholder')}
          />
        </div>

        {error && (
          <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.title || form.blood_types_needed.length === 0 || !form.campaign_date}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(141,0,41,0.15)] hover:shadow-[0_12px_32px_rgba(141,0,41,0.25)] active:scale-[0.98] transition-all duration-200 text-lg disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">campaign</span>
          {loading ? t('creatingCampaign') : t('submitCampaign')}
        </button>
      </form>
    </div>
  )
}
