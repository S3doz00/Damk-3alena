import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'

interface SystemParam {
  id: string
  key: string
  value: string
  description: string | null
}

export default function SystemSettings() {
  const { t, lang } = useLanguage()
  const [params, setParams] = useState<SystemParam[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [aiRunning, setAiRunning] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    loadParams()
    checkAIService()
  }, [])

  async function checkAIService() {
    const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${aiServiceUrl}/health`, { signal: AbortSignal.timeout(3000) })
      setServiceStatus(res.ok ? 'online' : 'offline')
    } catch {
      setServiceStatus('offline')
    }
  }

  async function loadParams() {
    const { data, error } = await supabase
      .from('system_parameters')
      .select('*')
      .order('key')

    if (!error && data) setParams(data)
    setLoading(false)
  }

  async function updateParam(id: string, value: string) {
    setSaving(id)
    const { error } = await supabase
      .from('system_parameters')
      .update({ value })
      .eq('id', id)

    if (!error) {
      setParams(prev =>
        prev.map(p => p.id === id ? { ...p, value } : p)
      )
    }
    setSaving(null)
  }

  async function runAIForecast() {
    setAiRunning(true)
    setAiMessage('')

    try {
      const aiServiceUrl = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000'

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: userRecord } = await supabase
        .from('users').select('id').eq('auth_id', user.id).single()
      if (!userRecord) throw new Error('User profile not found')

      const { data: staffData } = await supabase
        .from('staff').select('facility_id').eq('user_id', userRecord.id).single()
      if (!staffData) throw new Error('Staff profile not found')

      const facilityId = staffData.facility_id

      const { data: facilities } = await supabase
        .from('facilities').select('id, name').limit(15)

      const allPredictions: any[] = []
      for (let i = 0; i < Math.min(facilities?.length || 1, 15); i++) {
        const res = await fetch(`${aiServiceUrl}/api/forecast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            facility_idx: i,
            blood_types: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
            weeks_ahead: 4,
          }),
        })
        if (!res.ok) throw new Error(`Forecast failed for facility ${i}`)
        const data = await res.json()
        allPredictions.push({ facility: facilities![i], predictions: data.predictions })
      }

      const { data: aiOutput, error: aiErr } = await supabase
        .from('ai_outputs')
        .insert({
          facility_id: facilityId,
          output_type: 'forecast',
          metadata: { triggered_by: user.id, facilities_count: facilities?.length },
        })
        .select('id')
        .single()

      if (aiErr) throw new Error(`Failed to create AI output: ${aiErr.message}`)

      const today = new Date()
      const forecastRows: any[] = []

      for (const { facility, predictions } of allPredictions) {
        for (const p of predictions) {
          const weekDate = new Date(today)
          weekDate.setDate(weekDate.getDate() + p.week_offset * 7)
          const dateStr = weekDate.toISOString().split('T')[0]

          forecastRows.push({
            ai_output_id: aiOutput.id,
            facility_id: facility.id,
            blood_type: p.blood_type,
            forecast_week: dateStr,
            predicted_units: p.predicted_units,
            confidence: p.confidence,
          })
        }
      }

      const { error: insertErr } = await supabase
        .from('forecast_results')
        .insert(forecastRows)

      if (insertErr) throw new Error(`Failed to save forecasts: ${insertErr.message}`)

      const { data: inventoryRows } = await supabase
        .from('facility_inventory')
        .select('blood_type, units')
        .eq('facility_id', facilityId)

      const inventory: Record<string, number> = {}
      for (const bt of ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']) {
        const row = inventoryRows?.find(r => r.blood_type === bt)
        inventory[bt] = row?.units ?? 0
      }

      const myFacilityForecasts = allPredictions
        .find(p => p.facility.id === facilityId)?.predictions || allPredictions[0]?.predictions || []

      const shortageRes = await fetch(`${aiServiceUrl}/api/shortage-detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forecasts: myFacilityForecasts,
          current_inventory: inventory,
          threshold_warning: 15,
          threshold_critical: 5,
        }),
      })

      if (shortageRes.ok) {
        const shortageData = await shortageRes.json()

        if (shortageData.alerts.length > 0) {
          const { data: shortageOutput } = await supabase
            .from('ai_outputs')
            .insert({
              facility_id: facilityId,
              output_type: 'shortage_alert',
              metadata: { inventory, triggered_by: user.id },
            })
            .select('id')
            .single()

          if (shortageOutput) {
            await supabase
              .from('shortage_alerts')
              .update({ is_active: false })
              .eq('facility_id', facilityId)

            const alertRows = shortageData.alerts.map((a: any) => ({
              ai_output_id: shortageOutput.id,
              facility_id: facilityId,
              blood_type: a.blood_type,
              severity: a.severity,
              current_units: a.current_units,
              predicted_units: a.predicted_demand,
              threshold: a.threshold,
              message: a.message,
              is_active: true,
            }))

            await supabase.from('shortage_alerts').insert(alertRows)
          }
        }
      }

      const { data: openRequests } = await supabase
        .from('blood_requests')
        .select('id, blood_type, facility_id, facilities(latitude, longitude)')
        .eq('status', 'open')
        .limit(5)

      if (openRequests && openRequests.length > 0) {
        const { data: donors } = await supabase
          .from('donors')
          .select('id, blood_type, latitude, longitude, is_eligible, total_donations, last_donation')

        if (donors && donors.length > 0) {
          for (const req of openRequests) {
            const fac = req.facilities as any
            if (!fac?.latitude || !fac?.longitude) continue

            const donorPayload = donors.map(d => ({
              donor_id: d.id,
              blood_type: d.blood_type,
              latitude: d.latitude || 31.95,
              longitude: d.longitude || 35.93,
              is_eligible: d.is_eligible ?? true,
              total_donations: d.total_donations || 0,
              last_donation: d.last_donation,
            }))

            const recoRes = await fetch(`${aiServiceUrl}/api/recommend-donors`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                request_blood_type: req.blood_type,
                facility_lat: fac.latitude,
                facility_lng: fac.longitude,
                donors: donorPayload,
                top_n: 10,
              }),
            })

            if (recoRes.ok) {
              const recoData = await recoRes.json()

              if (recoData.recommendations.length > 0) {
                const { data: recoOutput } = await supabase
                  .from('ai_outputs')
                  .insert({
                    facility_id: req.facility_id,
                    output_type: 'donor_recommendation',
                    metadata: { request_id: req.id },
                  })
                  .select('id')
                  .single()

                if (recoOutput) {
                  const recoRows = recoData.recommendations.map((r: any) => ({
                    ai_output_id: recoOutput.id,
                    request_id: req.id,
                    donor_id: r.donor_id,
                    score: r.score,
                    distance_km: r.distance_km,
                    is_eligible: r.is_eligible,
                    blood_compatible: r.blood_compatible,
                    reasoning: r.reasoning,
                  }))

                  await supabase.from('donor_recommendations').insert(recoRows)
                }
              }
            }
          }
        }
      }

      const totalForecasts = forecastRows.length
      setAiMessage(`Forecast completed! ${totalForecasts} predictions saved for ${facilities?.length || 1} facilities. Check AI Insights page.`)
    } catch (err: any) {
      setAiMessage(`Error: ${err.message}`)
    } finally {
      setAiRunning(false)
    }
  }

  function formatParamLabel(key: string): string {
    const translated = t(key as any)
    if (translated && translated !== key) return translated
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Translated descriptions (overrides the DB English description when in AR)
  const paramDescriptions: Record<string, { en: string; ar: string }> = {
    shortage_threshold_critical: { en: 'Units below which a blood type is critically short', ar: 'الوحدات التي تعتبر دونها فصيلة الدم في نقص حرج' },
    shortage_threshold_warning:  { en: 'Units below which a blood type triggers a warning',  ar: 'الوحدات التي تستدعي دونها تنبيه للفصيلة' },
    shortage_threshold_units:    { en: 'Units below which a shortage alert is triggered',     ar: 'الوحدات التي تستدعي دونها تنبيه النقص' },
    eligibility_days:            { en: 'Minimum days between donations',                      ar: 'الحد الأدنى للأيام بين التبرعات' },
    eligibility_gap_days:        { en: 'Minimum days between donations',                      ar: 'الحد الأدنى للأيام بين التبرعات' },
    donation_interval_days:      { en: 'Minimum days between donations',                      ar: 'الحد الأدنى للأيام بين التبرعات' },
    notification_radius_km:      { en: 'Max distance in km for donor notifications',          ar: 'الحد الأقصى للمسافة بالكم لإشعار المتبرعين' },
    forecast_horizon_weeks:      { en: 'Number of weeks to forecast ahead',                   ar: 'عدد الأسابيع للتوقع المسبق' },
    max_appointments_per_day:    { en: 'Maximum bookings per day per facility',               ar: 'الحد الأقصى للحجوزات يوميًا لكل منشأة' },
    appointment_slot_minutes:    { en: 'Duration of each appointment slot in minutes',        ar: 'مدة كل موعد بالدقائق' },
    min_inventory_units:         { en: 'Minimum safe blood units to keep in stock',           ar: 'الحد الأدنى لوحدات الدم الآمنة في المخزون' },
    recommendation_top_n:        { en: 'Number of donors to include in recommendations',     ar: 'عدد المتبرعين المقترحين في كل توصية' },
    ai_confidence_threshold:     { en: 'Minimum AI confidence score to show predictions',    ar: 'الحد الأدنى لدرجة ثقة الذكاء الاصطناعي' },
    max_age_years:               { en: 'Maximum donor age in years',                         ar: 'الحد الأقصى لعمر المتبرع بالسنوات' },
    min_age_years:               { en: 'Minimum donor age in years',                         ar: 'الحد الأدنى لعمر المتبرع بالسنوات' },
    min_weight_kg:               { en: 'Minimum donor weight in kg',                         ar: 'الحد الأدنى لوزن المتبرع بالكيلوغرام' },
  }

  function getParamDescription(key: string, dbDesc: string | null): string {
    const entry = paramDescriptions[key]
    if (entry) return entry[lang as 'en' | 'ar'] ?? dbDesc ?? ''
    return dbDesc ?? ''
  }

  const paramIcons: Record<string, string> = {
    shortage_threshold_critical: 'crisis_alert',
    shortage_threshold_warning:  'warning',
    shortage_threshold_units:    'crisis_alert',
    eligibility_days:            'schedule',
    eligibility_gap_days:        'schedule',
    donation_interval_days:      'event_repeat',
    notification_radius_km:      'my_location',
    forecast_horizon_weeks:      'trending_up',
    max_appointments_per_day:    'calendar_today',
    appointment_slot_minutes:    'timer',
    min_inventory_units:         'inventory_2',
    recommendation_top_n:        'person_search',
    ai_confidence_threshold:     'analytics',
    max_age_years:               'elderly',
    min_age_years:               'person',
    min_weight_kg:               'monitor_weight',
  }

  const serviceLabel = serviceStatus === 'checking'
    ? t('serviceChecking')
    : serviceStatus === 'online'
    ? t('serviceOnline')
    : t('serviceOffline')

  return (
    <div>
      <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
        {t('systemSettings')}
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        {t('systemSettingsDesc')}
      </p>

      {/* AI Pipeline Controls */}
      <div className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-2xl border border-primary/20">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface">{t('aiPipeline')}</h2>
              <p className="text-xs text-on-surface-variant">{t('aiPipelineDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: serviceStatus === 'online' ? '#10B981' : serviceStatus === 'offline' ? '#F43F5E' : '#F59E0B',
                boxShadow: serviceStatus === 'online' ? '0 0 6px #10B981' : undefined,
              }}
            />
            <span className="text-xs font-medium text-on-surface-variant">{serviceLabel}</span>
          </div>
        </div>
        <button
          onClick={runAIForecast}
          disabled={aiRunning}
          className="w-full bg-primary text-on-primary font-bold py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">{aiRunning ? 'hourglass_empty' : 'trending_up'}</span>
          {aiRunning ? t('runningForecast') : t('runAIForecastBtn')}
        </button>
        {aiMessage && (
          <p className={`mt-3 text-sm font-medium ${aiMessage.startsWith('Error') ? 'text-error' : 'text-tertiary'}`}>
            {aiMessage}
          </p>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">{t('loading')}</div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {params.map(param => (
            <div
              key={param.id}
              className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-xl">
                    {paramIcons[param.key] || 'tune'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-headline font-bold text-on-surface">
                    {formatParamLabel(param.key)}
                  </h3>
                  {param.description && (
                    <p className="text-xs text-on-surface-variant">{getParamDescription(param.key, param.description)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={param.value}
                  onChange={(e) => setParams(prev =>
                    prev.map(p => p.id === param.id ? { ...p, value: e.target.value } : p)
                  )}
                  className="flex-1 bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-secondary/20 text-on-surface font-medium"
                />
                <button
                  onClick={() => updateParam(param.id, param.value)}
                  disabled={saving === param.id}
                  className="px-5 py-3 bg-secondary text-on-secondary rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-secondary/20 active:scale-95 transition-all disabled:opacity-60"
                >
                  {saving === param.id ? t('saving') : t('save')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
