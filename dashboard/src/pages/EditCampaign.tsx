import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const URGENCY_LEVELS = ['medium', 'high', 'critical']

interface FacilityOption {
  id: string
  name: string
  city: string
}

export default function EditCampaign() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
    is_active: true,
  })

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('facilities').select('id, name, city'),
      supabase.from('campaigns').select('*').eq('id', id).single(),
    ]).then(([facRes, campRes]) => {
      if (facRes.data) setFacilities(facRes.data)
      if (campRes.data) {
        const c = campRes.data
        setForm({
          title: c.title || '',
          facility_id: c.facility_id || '',
          campaign_date: c.campaign_date || '',
          start_time: (c.start_time || '08:00').slice(0, 5),
          end_time: (c.end_time || '16:00').slice(0, 5),
          target_donors: c.target_donors || 50,
          blood_types_needed: c.blood_types_needed || [],
          urgency: c.urgency || 'medium',
          description: c.description || '',
          is_active: c.is_active ?? true,
        })
      } else {
        setError('Campaign not found')
      }
      setLoading(false)
    })
  }, [id])

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
    if (!id) return
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        title: form.title,
        facility_id: form.facility_id || null,
        campaign_date: form.campaign_date,
        start_time: form.start_time,
        end_time: form.end_time,
        target_donors: form.target_donors,
        blood_types_needed: form.blood_types_needed,
        urgency: form.urgency,
        description: form.description,
        is_active: form.is_active,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
    } else {
      setSuccess(true)
      setSaving(false)
      setTimeout(() => navigate('/campaigns'), 1200)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm(t('confirmDeleteCampaign'))) return
    setDeleting(true)
    const { error: delError } = await supabase.from('campaigns').delete().eq('id', id)
    if (delError) {
      setError(delError.message)
      setDeleting(false)
    } else {
      navigate('/campaigns')
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-on-surface-variant">{t('loading')}</div>
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
          {t('editCampaign')}
        </h1>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-error hover:bg-error/10 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 transition"
        >
          <span className="material-symbols-outlined text-base">delete</span>
          {t('deleteCampaign')}
        </button>
      </div>
      <p className="text-on-surface-variant text-sm mb-8">{t('editCampaignDesc')}</p>

      {success && (
        <div className="bg-secondary-container/30 text-secondary px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {t('campaignUpdated')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('campaignName')}</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
          />
        </div>

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
            <label className="block text-sm font-semibold text-on-surface-variant">Start</label>
            <input
              type="time"
              required
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">End</label>
            <input
              type="time"
              required
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
        </div>

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

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium resize-none h-24"
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-5 h-5 accent-primary"
          />
          <label htmlFor="is_active" className="text-sm font-semibold text-on-surface">
            {t('campaignActive')}
          </label>
        </div>

        {error && (
          <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm font-medium">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="flex-1 bg-surface-container-low text-on-surface font-bold py-4 rounded-xl hover:bg-surface-container-high active:scale-[0.98] transition-all text-lg"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={saving || !form.title || form.blood_types_needed.length === 0 || !form.campaign_date}
            className="flex-[2] bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(141,0,41,0.15)] hover:shadow-[0_12px_32px_rgba(141,0,41,0.25)] active:scale-[0.98] transition-all text-lg disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            {saving ? t('updating') : t('saveCampaign')}
          </button>
        </div>
      </form>
    </div>
  )
}
