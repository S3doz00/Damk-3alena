import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface ForecastResult {
  id: string
  blood_type: string
  forecast_week: string
  predicted_units: number
  confidence: number
}

interface ShortageAlert {
  id: string
  blood_type: string
  severity: string
  current_units: number
  predicted_units: number
  message: string
  is_active: boolean
}

interface DonorRecommendation {
  id: string
  donor_id: string
  score: number
  distance_km: number
  reasoning: string
  donors: {
    blood_type: string
    users: { first_name: string; last_name: string }
  }
}

const BLOOD_COLORS: Record<string, string> = {
  'O+': '#EF4444', 'O-': '#F97316',
  'A+': '#A855F7', 'A-': '#7C3AED',
  'B+': '#3B82F6', 'B-': '#06B6D4',
  'AB+': '#10B981', 'AB-': '#F59E0B',
}

export default function AIOutputs() {
  const { t } = useLanguage()
  const [forecasts, setForecasts] = useState<ForecastResult[]>([])
  const [alerts, setAlerts] = useState<ShortageAlert[]>([])
  const [recommendations, setRecommendations] = useState<DonorRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAIData()
  }, [])

  async function loadAIData() {
    const [forecastRes, alertRes, recoRes] = await Promise.all([
      supabase
        .from('forecast_results')
        .select('*')
        .order('forecast_week', { ascending: true })
        .limit(40),
      supabase
        .from('shortage_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('donor_recommendations')
        .select(`
          id, donor_id, score, distance_km, reasoning,
          donors ( blood_type, users:user_id ( first_name, last_name ) )
        `)
        .order('score', { ascending: false })
        .limit(10),
    ])

    if (forecastRes.data) setForecasts(forecastRes.data)
    if (alertRes.data) setAlerts(alertRes.data)
    if (recoRes.data) setRecommendations(recoRes.data as unknown as DonorRecommendation[])
    setLoading(false)
  }

  const forecastChartData = forecasts.reduce((acc: Record<string, number | string>[], f) => {
    const existing = acc.find(row => row.week === f.forecast_week)
    if (existing) {
      existing[f.blood_type] = f.predicted_units
    } else {
      acc.push({ week: f.forecast_week, [f.blood_type]: f.predicted_units } as Record<string, number | string>)
    }
    return acc
  }, [])

  const bloodTypesInData = [...new Set(forecasts.map(f => f.blood_type))]
  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const warningAlerts = alerts.filter(a => a.severity === 'warning')
  const maxScore = recommendations[0]?.score || 100

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-container-high rounded-xl" />
        <div className="h-20 bg-surface-container-lowest rounded-2xl border border-outline" />
        <div className="h-72 bg-surface-container-lowest rounded-2xl border border-outline" />
        <div className="h-64 bg-surface-container-lowest rounded-2xl border border-outline" />
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-headline font-bold text-2xl text-on-surface">{t('aiInsights')}</h1>
        <p className="text-on-surface-variant text-sm mt-0.5">
          {t('aiInsightsDesc')}
        </p>
      </div>

      {/* Critical Shortage Banner */}
      {criticalAlerts.length > 0 && (
        <div
          className="rounded-2xl border border-error/30 bg-error/5 p-5"
          style={{ animation: 'glow-pulse 2.5s ease-in-out infinite' }}
        >
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-error/15 flex items-center justify-center flex-shrink-0">
              <span
                className="material-symbols-outlined text-error"
                style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <p className="font-semibold text-error text-sm">{t('criticalShortageDetected')}</p>
                <span className="text-[10px] font-bold text-error/60 bg-error/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {criticalAlerts.length} {t('severity')}{criticalAlerts.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {criticalAlerts.map(a => (
                  <div
                    key={a.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-error/10 border border-error/20"
                  >
                    <span className="font-mono font-bold text-sm text-error">{a.blood_type}</span>
                    <span className="text-xs text-error/60">{a.current_units} {t('unitsLeft')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('supplyWarnings')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {warningAlerts.map(alert => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-secondary/5 border border-secondary/15"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)' }}
                >
                  <span className="font-mono font-bold text-sm text-secondary">{alert.blood_type}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface leading-snug">{alert.message}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {alert.current_units} {t('now')} → {alert.predicted_units} {t('predicted')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-headline font-bold text-base text-on-surface">{t('bloodDemandForecast')}</h2>
          {forecastChartData.length === 1 && (
            <span className="text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
              {t('oneWeekData')}
            </span>
          )}
        </div>
        <p className="text-xs text-on-surface-variant mb-5 max-w-xl">{t('bloodDemandDesc')}</p>

        {forecastChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-container-high)',
                  border: '1px solid var(--color-outline)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  padding: '10px 14px',
                  color: 'var(--color-on-surface)',
                }}
                labelStyle={{ color: 'var(--color-on-surface)', fontWeight: 600, marginBottom: '6px' }}
                cursor={{ stroke: 'var(--color-outline)', strokeWidth: 1 }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '11px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Fira Code, monospace' }}>{value}</span>
                )}
              />
              {bloodTypesInData.map(bt => (
                <Line
                  key={bt}
                  type="monotone"
                  dataKey={bt}
                  stroke={BLOOD_COLORS[bt] || '#94A3B8'}
                  strokeWidth={2}
                  dot={{ r: 4, fill: BLOOD_COLORS[bt] || '#94A3B8', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '24px' }}>
                show_chart
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface">{t('noForecastData')}</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              {t('runAIForecastHint')}
            </p>
          </div>
        )}
      </div>

      {/* Donor Recommendations */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline">
        <h2 className="font-headline font-bold text-base text-on-surface mb-5">{t('recommendedDonors')}</h2>

        {recommendations.length > 0 ? (
          <div className="space-y-1">
            {recommendations.map((rec, i) => {
              const pct = maxScore > 0 ? Math.round((rec.score / maxScore) * 100) : 0
              const btColor = BLOOD_COLORS[rec.donors?.blood_type] || '#E11D48'
              const isTop3 = i < 3

              return (
                <div
                  key={rec.id}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-transparent hover:bg-surface-container hover:border-outline transition-all duration-150 cursor-default group"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ background: isTop3 ? 'rgba(225,29,72,0.12)' : 'rgba(255,255,255,0.04)' }}
                  >
                    <span className="font-mono font-bold text-xs" style={{ color: isTop3 ? '#E11D48' : '#64748B' }}>
                      {i + 1}
                    </span>
                  </div>

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${btColor}15`, border: `1px solid ${btColor}25` }}
                  >
                    <span className="font-mono font-bold text-[11px]" style={{ color: btColor }}>
                      {rec.donors?.blood_type}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate leading-tight">
                      {rec.donors?.users?.first_name} {rec.donors?.users?.last_name}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{rec.reasoning}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: '#E11D48' }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-on-surface-variant flex-shrink-0">
                        {rec.score} {t('pts')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-xs text-on-surface-variant">{rec.distance_km} {t('km')}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '24px' }}>
                person_search
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface">{t('noRecommendations')}</p>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              {t('noRecommendationsDesc')}
            </p>
          </div>
        )}
      </div>

    </div>
  )
}
