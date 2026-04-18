import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

interface FacilityOption {
  id: string
  name: string
  city: string
}

export default function StaffProfile() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [facilities, setFacilities] = useState<FacilityOption[]>([])
  const [userId, setUserId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    facility_id: '',
    position: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [userRes, facRes] = await Promise.all([
      supabase.from('users').select('id, first_name, last_name, email, phone, role').eq('auth_id', user.id).single(),
      supabase.from('facilities').select('id, name, city'),
    ])

    if (facRes.data) setFacilities(facRes.data)

    if (userRes.data) {
      setUserId(userRes.data.id)
      setForm(prev => ({
        ...prev,
        first_name: userRes.data.first_name || '',
        last_name: userRes.data.last_name || '',
        email: userRes.data.email || user.email || '',
        phone: userRes.data.phone || '',
        role: userRes.data.role || '',
      }))

      const { data: staffData } = await supabase
        .from('staff').select('id, facility_id, position').eq('user_id', userRes.data.id).single()

      if (staffData) {
        setStaffId(staffData.id)
        setForm(prev => ({
          ...prev,
          facility_id: staffData.facility_id || '',
          position: staffData.position || '',
        }))
      }
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: userErr } = await supabase
      .from('users')
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
      })
      .eq('id', userId)

    if (userErr) { setError(userErr.message); setSaving(false); return }

    if (staffId) {
      const update: Record<string, unknown> = { position: form.position }
      if (form.role === 'admin') update.facility_id = form.facility_id || null
      const { error: staffErr } = await supabase
        .from('staff')
        .update(update)
        .eq('id', staffId)

      if (staffErr) { setError(staffErr.message); setSaving(false); return }
    }

    setSuccess(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-on-surface-variant">{t('loading')}</div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
        {t('editProfile')}
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        {t('editProfileDesc')}
      </p>

      {success && (
        <div className="bg-secondary-container/30 text-secondary px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {t('profileUpdated')}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('firstName')}</label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('lastName')}</label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('email')}</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-on-surface-variant font-medium opacity-60 cursor-not-allowed"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('phone')}</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
          />
        </div>

        {/* Role (read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('role')}</label>
          <input
            type="text"
            value={form.role}
            disabled
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-on-surface-variant font-medium opacity-60 cursor-not-allowed"
          />
        </div>

        {/* Facility — read-only for staff; admins can reassign */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('facility')}</label>
          {form.role === 'admin' ? (
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
          ) : (
            <input
              type="text"
              value={(() => {
                const f = facilities.find(x => x.id === form.facility_id)
                return f ? `${f.name} — ${f.city}` : ''
              })()}
              disabled
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-on-surface-variant font-medium opacity-60 cursor-not-allowed"
            />
          )}
        </div>

        {/* Position */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('position')}</label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
          />
        </div>

        {error && (
          <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(141,0,41,0.15)] hover:shadow-[0_12px_32px_rgba(141,0,41,0.25)] active:scale-[0.98] transition-all duration-200 text-lg disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">save</span>
          {saving ? t('updating') : t('updateProfile')}
        </button>
      </form>
    </div>
  )
}
