import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const URGENCY_LEVELS = ['normal', 'urgent', 'critical']

export default function CreateRequest() {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    blood_type: '',
    units_needed: 1,
    urgency: 'normal',
    patient_name: '',
    patient_file_no: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { data: userRecord } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userRecord) { setError('User profile not found'); setLoading(false); return }

    const { data: staffData } = await supabase
      .from('staff')
      .select('id, facility_id')
      .eq('user_id', userRecord.id)
      .single()

    if (!staffData) {
      setError('Staff profile not found. Make sure your account is linked to a facility. Ask an admin to set this up.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase
      .from('blood_requests')
      .insert({
        facility_id: staffData.facility_id,
        created_by: staffData.id,
        blood_type: form.blood_type,
        units_needed: form.units_needed,
        urgency: form.urgency,
        patient_name: form.patient_name,
        patient_file_no: form.patient_file_no,
        notes: form.notes,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/requests'), 2000)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
        {t('createRequestTitle')}
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        {t('createRequestDesc')}
      </p>

      {success && (
        <div className="bg-secondary-container/30 text-secondary px-4 py-3 rounded-xl text-sm font-medium mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {t('requestCreated')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">
            {t('bloodTypeRequired')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map(bt => (
              <button
                key={bt}
                type="button"
                onClick={() => setForm({ ...form, blood_type: bt })}
                className={`py-3 rounded-xl font-bold text-sm transition-all ${
                  form.blood_type === bt
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('unitsNeeded')}</label>
            <input
              type="number"
              min="1"
              max="20"
              value={form.units_needed}
              onChange={(e) => setForm({ ...form, units_needed: Number(e.target.value) })}
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
                        : level === 'urgent'
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('patientName')}</label>
            <input
              type="text"
              value={form.patient_name}
              onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-outline/60"
              placeholder={t('enterPatientName')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant">{t('fileNumber')}</label>
            <input
              type="text"
              value={form.patient_file_no}
              onChange={(e) => setForm({ ...form, patient_file_no: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-outline/60"
              placeholder={t('patientFileNoPlaceholder')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface-variant">{t('additionalNotes')}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/20 text-on-surface font-medium placeholder:text-outline/60 resize-none h-24"
            placeholder={t('additionalInfo')}
          />
        </div>

        {error && (
          <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.blood_type}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(141,0,41,0.15)] hover:shadow-[0_12px_32px_rgba(141,0,41,0.25)] active:scale-[0.98] transition-all duration-200 text-lg disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">send</span>
          {loading ? t('submitting') : t('submitRequest')}
        </button>
      </form>
    </div>
  )
}
