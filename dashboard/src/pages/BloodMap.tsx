import { useEffect, useId, useRef, useState } from 'react'
import {
  Map,
  useMap,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapControls,
} from '@/components/ui/map'
import type { MapRef } from '@/components/ui/map'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import { InfoPopover } from '@/components/ui/info-popover'

/* ── Types ──────────────────────────────────────────────────── */
interface Facility {
  id: string
  name: string
  type: string
  city: string
  latitude: number
  longitude: number
  phone: string
  working_hours: string
}

interface InventoryRow {
  facility_id: string
  blood_type: string
  units: number
}

interface ShortageAlert {
  facility_id: string
  blood_type: string
  severity: string
  current_units: number
  message: string
}

interface ForecastRow {
  facility_id: string
  blood_type: string
  predicted_units: number
  forecast_week: string
}

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
const BT_COLORS: Record<string, string> = {
  'O+': '#EF4444', 'O-': '#F97316',
  'A+': '#A855F7', 'A-': '#7C3AED',
  'B+': '#3B82F6', 'B-': '#06B6D4',
  'AB+': '#10B981', 'AB-': '#F59E0B',
}

function getSeverityForFacility(
  facilityId: string,
  inventory: InventoryRow[],
  alerts: ShortageAlert[],
): 'critical' | 'warning' | 'healthy' {
  const hasCritical = alerts.some(a => a.facility_id === facilityId && a.severity === 'critical')
  if (hasCritical) return 'critical'
  const hasWarning = alerts.some(a => a.facility_id === facilityId && a.severity === 'warning')
  if (hasWarning) return 'warning'
  const inv = inventory.filter(i => i.facility_id === facilityId)
  if (inv.some(i => i.units < 10)) return 'warning'
  return 'healthy'
}

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', pulse: true, label: 'Critical', labelAr: 'حرج' },
  warning:  { color: '#F59E0B', pulse: false, label: 'Warning', labelAr: 'تحذير' },
  healthy:  { color: '#10B981', pulse: false, label: 'Adequate', labelAr: 'كافي' },
}

/* ── Auto-resize map on container dimension changes (Task 1) ──────── */
function MapResizeObserver() {
  const { map } = useMap()
  useEffect(() => {
    if (!map) return
    const container = map.getContainer()
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(container)
    return () => ro.disconnect()
  }, [map])
  return null
}

/* ── Heatmap Layer (MapLibre native — mapcn exposes map via useMap) ── */
function HeatmapLayer({ facilities, inventory }: {
  facilities: Facility[]
  inventory: InventoryRow[]
}) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `blood-heat-${id}`
  const layerId = `blood-heat-layer-${id}`

  useEffect(() => {
    if (!map || !isLoaded || facilities.length === 0) return

    const features = facilities.map(f => {
      const inv = inventory.filter(i => i.facility_id === f.id)
      const totalUnits = inv.reduce((s, i) => s + i.units, 0)
      const maxPossible = BLOOD_TYPES.length * 50
      const shortage = Math.max(0, maxPossible - totalUnits) / maxPossible
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [f.longitude, f.latitude] },
        properties: { intensity: shortage, name: f.name },
      }
    })

    if (map.getSource(sourceId)) return

    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    })

    map.addLayer({
      id: layerId,
      type: 'heatmap',
      source: sourceId,
      maxzoom: 12,
      paint: {
        'heatmap-weight': ['get', 'intensity'],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 5, 0.6, 10, 1.5],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(225, 29, 72, 0)',
          0.2, 'rgba(245, 158, 11, 0.25)',
          0.4, 'rgba(245, 158, 11, 0.45)',
          0.6, 'rgba(239, 68, 68, 0.5)',
          0.8, 'rgba(225, 29, 72, 0.65)',
          1, 'rgba(225, 29, 72, 0.85)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 5, 40, 10, 80],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.6, 12, 0.15],
      },
    })

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch { /* unmounted */ }
    }
  }, [map, isLoaded, facilities, inventory, sourceId, layerId])

  return null
}

/* ── Facility Markers (mapcn MapMarker) ────────────────────── */
function FacilityMarkers({ facilities, inventory, alerts, onSelect, selectedId, t }: {
  facilities: Facility[]
  inventory: InventoryRow[]
  alerts: ShortageAlert[]
  onSelect: (f: Facility) => void
  selectedId: string | null
  t: (k: string) => string
}) {
  return (
    <>
      {facilities.map(f => {
        const severity = getSeverityForFacility(f.id, inventory, alerts)
        const config = SEVERITY_CONFIG[severity]
        const isSelected = selectedId === f.id
        const size = severity === 'critical' ? 22 : 16
        const inv = inventory.filter(i => i.facility_id === f.id)
        const totalUnits = inv.reduce((s, i) => s + i.units, 0)

        return (
          <MapMarker
            key={f.id}
            longitude={f.longitude}
            latitude={f.latitude}
            onClick={() => onSelect(f)}
          >
            <MarkerContent>
              <div
                className="rounded-full border-[2.5px] border-white/90 transition-transform hover:scale-[1.4]"
                style={{
                  width: size,
                  height: size,
                  background: config.color,
                  boxShadow: isSelected
                    ? `0 0 0 6px rgba(255,255,255,0.5), 0 0 0 9px ${config.color}, 0 0 24px ${config.color}`
                    : `0 0 ${severity === 'critical' ? '12px' : '6px'} ${config.color}88`,
                  animation: config.pulse ? 'marker-pulse 2s ease-in-out infinite' : undefined,
                  transform: isSelected ? 'scale(1.25)' : undefined,
                }}
              />
            </MarkerContent>
            <MarkerTooltip>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">{f.name}</span>
                <span className="opacity-70">{f.city} · {totalUnits} {t('mapUnits')}</span>
              </div>
            </MarkerTooltip>
          </MapMarker>
        )
      })}
    </>
  )
}

/* ── Facility Detail Overlay (absolute-positioned card) ──────── */
function FacilityDetailOverlay({ facility, inventory, alerts, forecasts, onClose, t }: {
  facility: Facility
  inventory: InventoryRow[]
  alerts: ShortageAlert[]
  forecasts: ForecastRow[]
  onClose: () => void
  t: (k: string) => string
}) {
  const facInv = inventory.filter(i => i.facility_id === facility.id)
  const facAlerts = alerts.filter(a => a.facility_id === facility.id)
  const facForecasts = forecasts.filter(f => f.facility_id === facility.id)
  const severity = getSeverityForFacility(facility.id, inventory, alerts)
  const config = SEVERITY_CONFIG[severity]
  const maxUnits = Math.max(...facInv.map(i => i.units), 50)

  // For each blood type — nearest-week predicted demand
  const demandByType: Record<string, number> = {}
  for (const bt of BLOOD_TYPES) {
    const rows = facForecasts.filter(f => f.blood_type === bt).sort((a, b) => a.forecast_week.localeCompare(b.forecast_week))
    demandByType[bt] = rows[0]?.predicted_units ?? 0
  }

  const totalStock = facInv.reduce((s, i) => s + i.units, 0)
  const totalDemand = Object.values(demandByType).reduce((s, v) => s + v, 0)

  return (
    <div className="absolute top-4 ltr:right-4 rtl:left-4 bottom-4 z-30 w-[340px] max-w-[90vw] bg-surface/95 backdrop-blur-lg border border-outline rounded-2xl shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-surface/95 backdrop-blur-lg p-4 border-b border-outline z-10">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: config.color, boxShadow: `0 0 6px ${config.color}` }}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>
              {t(severity === 'healthy' ? 'mapHealthy' : severity)}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label={t('closeCard')}
            className="w-7 h-7 -mt-1 -mr-1 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>
        <h3 className="font-headline font-bold text-base leading-tight text-on-surface">{facility.name}</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          {facility.city} &middot; {facility.type === 'blood_bank' ? t('mapBloodBank') : t('mapHospital')}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
            {facility.working_hours}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>call</span>
            {facility.phone}
          </span>
        </div>
      </div>

      {/* Summary: Total stock vs total demand */}
      <div className="grid grid-cols-2 gap-2 p-4">
        <div className="rounded-xl bg-surface-container-low px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/70">{t('totalStockShort')}</p>
          <p className="font-mono font-bold text-base text-on-surface mt-0.5">{totalStock}</p>
          <p className="text-[10px] text-on-surface-variant">{t('units')}</p>
        </div>
        <div className="rounded-xl bg-surface-container-low px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/70">{t('predictedDemandNext')}</p>
          <p className="font-mono font-bold text-base text-primary mt-0.5">{totalDemand > 0 ? totalDemand : '—'}</p>
          <p className="text-[10px] text-on-surface-variant">{t('units')}</p>
        </div>
      </div>

      {/* Shortage Alerts */}
      {facAlerts.length > 0 && (
        <div className="px-4 pb-2 space-y-1.5">
          {facAlerts.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: a.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '14px', color: a.severity === 'critical' ? '#EF4444' : '#F59E0B', fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
              <span className="text-xs font-medium flex-1" style={{ color: a.severity === 'critical' ? '#EF4444' : '#F59E0B' }}>
                {a.blood_type} — {a.current_units} {t('unitsLeft')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Supply vs Demand per blood type */}
      <div className="p-4 border-t border-outline">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest">{t('supplyVsDemand')}</p>
        </div>
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2 gap-y-2 items-center">
          <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider"></span>
          <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider">{t('bloodInventory')}</span>
          <span className="text-[9px] font-bold text-on-surface-variant/50 uppercase tracking-wider text-right">{t('statusNow')}</span>
          <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wider text-right">{t('statusNextWeek')}</span>
          {BLOOD_TYPES.map(bt => {
            const row = facInv.find(i => i.blood_type === bt)
            const units = row?.units ?? 0
            const demand = demandByType[bt]
            const pct = Math.min(100, (units / maxUnits) * 100)
            const isLow = units < 10
            const isShort = demand > units
            return (
              <div key={bt} className="contents">
                <span className="font-mono text-[11px] font-bold text-on-surface-variant">{bt}</span>
                <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: isLow ? '#EF4444' : BT_COLORS[bt] }}
                  />
                </div>
                <span className={`font-mono text-[11px] text-right ${isLow ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                  {units}
                </span>
                <span className={`font-mono text-[11px] text-right ${isShort ? 'text-primary font-bold' : 'text-on-surface-variant/60'}`}>
                  {demand > 0 ? demand : '—'}
                </span>
              </div>
            )
          })}
        </div>
        {totalDemand === 0 && (
          <p className="text-[10px] text-on-surface-variant/60 mt-3 italic">{t('noForecastForFacility')}</p>
        )}
      </div>
    </div>
  )
}

/* ── Stats Overlay ──────────────────────────────────────────── */
function StatsOverlay({ facilities, inventory, alerts, t }: {
  facilities: Facility[]
  inventory: InventoryRow[]
  alerts: ShortageAlert[]
  t: (k: string) => string
}) {
  const critCount = new Set(alerts.filter(a => a.severity === 'critical').map(a => a.facility_id)).size
  const warnCount = new Set(alerts.filter(a => a.severity === 'warning').map(a => a.facility_id)).size
  const totalUnits = inventory.reduce((s, i) => s + i.units, 0)

  return (
    <div className="absolute bottom-4 ltr:left-4 rtl:right-4 z-20 flex gap-2">
      <div className="bg-surface/90 backdrop-blur-lg border border-outline rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-error" style={{ boxShadow: '0 0 6px #EF4444' }} />
          <span className="text-xs font-bold text-error">{critCount}</span>
          <span className="text-[10px] text-on-surface-variant">{t('critical')}</span>
        </div>
        <div className="w-px h-4 bg-outline" />
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
          <span className="text-xs font-bold text-secondary">{warnCount}</span>
          <span className="text-[10px] text-on-surface-variant">{t('warning')}</span>
        </div>
        <div className="w-px h-4 bg-outline" />
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '14px' }}>local_hospital</span>
          <span className="text-xs font-bold text-on-surface">{facilities.length}</span>
          <span className="text-[10px] text-on-surface-variant">{t('mapFacilities')}</span>
        </div>
        <div className="w-px h-4 bg-outline" />
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '14px' }}>water_drop</span>
          <span className="text-xs font-bold text-on-surface">{totalUnits}</span>
          <span className="text-[10px] text-on-surface-variant">{t('totalUnits')}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Legend ──────────────────────────────────────────────────── */
function Legend({ t }: { t: (k: string) => string }) {
  return (
    <div className="absolute top-4 ltr:left-4 rtl:right-4 z-20 bg-surface/90 backdrop-blur-lg border border-outline rounded-xl px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">{t('bloodSupplyMap')}</p>
        <InfoPopover side="right">
          <h4 className="font-headline font-bold text-sm mb-2">{t('mapInfoTitle')}</h4>
          <p className="text-xs text-on-surface-variant leading-relaxed">{t('mapInfoContent')}</p>
        </InfoPopover>
      </div>
      <div className="space-y-1.5">
        {([['critical', 'critical'], ['warning', 'warning'], ['healthy', 'mapHealthy']] as const).map(([s, key]) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: SEVERITY_CONFIG[s].color, boxShadow: `0 0 4px ${SEVERITY_CONFIG[s].color}66` }}
            />
            <span className="text-xs text-on-surface">{t(key)}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full" style={{
            background: 'radial-gradient(circle, rgba(225,29,72,0.6), rgba(245,158,11,0.2))',
          }} />
          <span className="text-xs text-on-surface-variant">{t('heatmapLabel')}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function BloodMap() {
  const { t } = useLanguage()
  const mapRef = useRef<MapRef>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [inventory, setInventory] = useState<InventoryRow[]>([])
  const [alerts, setAlerts] = useState<ShortageAlert[]>([])
  const [forecasts, setForecasts] = useState<ForecastRow[]>([])
  const [selected, setSelected] = useState<Facility | null>(null)
  const [loading, setLoading] = useState(true)

  const handleSelectFacility = (f: Facility) => {
    mapRef.current?.flyTo({ center: [f.longitude, f.latitude], zoom: 11, duration: 900 })
    setSelected(f)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [facRes, invRes, alertRes, forecastRes] = await Promise.all([
      supabase.from('facilities').select('id, name, type, city, latitude, longitude, phone, working_hours'),
      supabase.from('facility_inventory').select('facility_id, blood_type, units'),
      supabase.from('shortage_alerts').select('facility_id, blood_type, severity, current_units, message').eq('is_active', true),
      supabase.from('forecast_results').select('facility_id, blood_type, predicted_units, forecast_week').order('forecast_week', { ascending: true }),
    ])
    if (facRes.data) setFacilities(facRes.data)
    if (invRes.data) setInventory(invRes.data)
    if (alertRes.data) setAlerts(alertRes.data)
    if (forecastRes.data) setForecasts(forecastRes.data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>map</span>
          </div>
          <p className="text-sm text-on-surface-variant">{t('loadingMap')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Map ref={mapRef} center={[36.2, 31.5]} zoom={7.8} minZoom={6} maxZoom={14} loading={loading}>
        <MapResizeObserver />
        <HeatmapLayer facilities={facilities} inventory={inventory} />
        <FacilityMarkers
          facilities={facilities}
          inventory={inventory}
          alerts={alerts}
          onSelect={handleSelectFacility}
          selectedId={selected?.id ?? null}
          t={t}
        />
        <MapControls position="bottom-right" showZoom showCompass />
      </Map>

      <Legend t={t} />
      <StatsOverlay facilities={facilities} inventory={inventory} alerts={alerts} t={t} />

      {selected && (
        <FacilityDetailOverlay
          key={selected.id}
          facility={selected}
          inventory={inventory}
          alerts={alerts}
          forecasts={forecasts}
          onClose={() => setSelected(null)}
          t={t}
        />
      )}
    </div>
  )
}
