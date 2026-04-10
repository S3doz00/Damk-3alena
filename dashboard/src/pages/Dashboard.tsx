import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
  PieChart, Pie, Legend,
} from 'recharts'
import { useLanguage } from '../context/LanguageContext'

// Blood type families: O=red, A=violet, B=blue, AB=teal
const BLOOD_TYPE_COLORS: Record<string, string> = {
  'O+':  '#E11D48', 'O-':  '#FB7185',
  'A+':  '#7C3AED', 'A-':  '#A78BFA',
  'B+':  '#2563EB', 'B-':  '#60A5FA',
  'AB+': '#0D9488', 'AB-': '#2DD4BF',
}

const ALL_BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

const weekLabel = (weeksAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - weeksAgo * 7)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const glass = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

interface RawRequest {
  id: string
  blood_type: string
  status: string
}

interface RawAppointment {
  id: string
  donors: { blood_type: string } | null
}

interface RawDonor {
  id: string
  blood_type: string
}

export default function Dashboard() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<{ blood_type: string; units: number }[]>([])
  const [weeklyBookings, setWeeklyBookings] = useState<{ day: string; bookings: number }[]>([])

  // Raw data for filtering
  const [rawRequests, setRawRequests] = useState<RawRequest[]>([])
  const [rawAppointments, setRawAppointments] = useState<RawAppointment[]>([])
  const [rawDonors, setRawDonors] = useState<RawDonor[]>([])

  // Interactive state
  const [selectedBloodType, setSelectedBloodType] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]

    // Resolve current user's facility
    const { data: { user } } = await supabase.auth.getUser()
    let facilityId: string | null = null
    if (user) {
      const { data: userRecord } = await supabase
        .from('users').select('id').eq('auth_id', user.id).single()
      if (userRecord) {
        const { data: staffData } = await supabase
          .from('staff').select('facility_id').eq('user_id', userRecord.id).single()
        facilityId = staffData?.facility_id ?? null
      }
    }

    const inventoryQuery = facilityId
      ? supabase.from('facility_inventory').select('blood_type, units').eq('facility_id', facilityId)
      : supabase.from('facility_inventory').select('blood_type, units').limit(8)

    const [requestsRes, todayApptsRes, inventoryRes, donorsRes] = await Promise.all([
      supabase.from('blood_requests').select('id, blood_type, status'),
      supabase.from('appointments').select('id, donors(blood_type)').eq('appointment_date', today).eq('status', 'booked'),
      inventoryQuery,
      supabase.from('donors').select('id, blood_type'),
    ])

    if (requestsRes.data) setRawRequests(requestsRes.data as RawRequest[])
    if (todayApptsRes.data) setRawAppointments(todayApptsRes.data as unknown as RawAppointment[])
    if (donorsRes.data) setRawDonors(donorsRes.data as RawDonor[])

    if (inventoryRes.data && inventoryRes.data.length > 0) {
      setInventory(inventoryRes.data)
    }

    setWeeklyBookings([
      { day: 'Sun', bookings: 12 },
      { day: 'Mon', bookings: 19 },
      { day: 'Tue', bookings: 8 },
      { day: 'Wed', bookings: 15 },
      { day: 'Thu', bookings: 22 },
      { day: 'Fri', bookings: 14 },
    ])

    setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const maxInventory = inventory.length > 0 ? Math.max(...inventory.map(i => i.units)) : 50

  // Proportional scale factor derived from donor share of the selected blood type
  const bloodTypeShare = useMemo(() => {
    if (!selectedBloodType || rawDonors.length === 0) return 1
    const matching = rawDonors.filter(d => d.blood_type === selectedBloodType).length
    return matching / rawDonors.length
  }, [selectedBloodType, rawDonors])

  // Proportional scale factor derived from the selected day of the week
  const dayShare = useMemo(() => {
    if (!selectedDay || weeklyBookings.length === 0) return 1
    const total = weeklyBookings.reduce((s, d) => s + d.bookings, 0)
    if (total === 0) return 1
    const day = weeklyBookings.find(d => d.day === selectedDay)
    return day ? day.bookings / total : 1
  }, [selectedDay, weeklyBookings])

  // Combined scale — both filters multiply
  const combinedShare = bloodTypeShare * dayShare

  // Weekly bookings filtered by selected blood type (proportional scaling)
  const filteredWeeklyBookings = useMemo(
    () => weeklyBookings.map(w => ({
      ...w,
      bookings: Math.round(w.bookings * bloodTypeShare),
    })),
    [weeklyBookings, bloodTypeShare],
  )

  // Filtered stats (blood type filters the set, day scales proportionally)
  const stats = useMemo(() => {
    const bt = selectedBloodType
    const filteredRequests = bt ? rawRequests.filter(r => r.blood_type === bt) : rawRequests
    const filteredAppts = bt ? rawAppointments.filter(a => a.donors?.blood_type === bt) : rawAppointments
    const filteredDonors = bt ? rawDonors.filter(d => d.blood_type === bt) : rawDonors

    return {
      openRequests: Math.round(filteredRequests.filter(r => ['open', 'in_progress'].includes(r.status)).length * dayShare),
      totalRequests: Math.round(filteredRequests.length * dayShare),
      todayAppointments: Math.round(filteredAppts.length * dayShare),
      totalDonors: Math.round(filteredDonors.length * dayShare),
    }
  }, [selectedBloodType, rawRequests, rawAppointments, rawDonors, dayShare])

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const statCards = [
    { icon: 'emergency', labelKey: 'openRequests',  value: stats.openRequests,       color: '#E11D48', glow: 'rgba(225,29,72,0.15)' },
    { icon: 'list_alt',  labelKey: 'totalRequests', value: stats.totalRequests,      color: '#7C3AED', glow: 'rgba(124,58,237,0.15)' },
    { icon: 'calendar_month', labelKey: 'todayAppts', value: stats.todayAppointments, color: '#0D9488', glow: 'rgba(13,148,136,0.15)' },
    { icon: 'group',     labelKey: 'activeDonors',  value: stats.totalDonors,        color: '#2563EB', glow: 'rgba(37,99,235,0.15)' },
  ]

  // Donut chart data from inventory
  const donutData = inventory.map(item => ({
    name: item.blood_type,
    value: item.units,
    fill: BLOOD_TYPE_COLORS[item.blood_type] || '#94A3B8',
  }))

  // Simulated weekly trend data for area chart (last 4 weeks)
  const trendData = useMemo(() => {
    const base = [
      { week: weekLabel(3), donations: 38, requests: 22, fulfilled: 20 },
      { week: weekLabel(2), donations: 42, requests: 18, fulfilled: 17 },
      { week: weekLabel(1), donations: 35, requests: 25, fulfilled: 22 },
      {
        week: 'Now',
        donations: weeklyBookings.reduce((s, d) => s + d.bookings, 0),
        requests: stats.totalRequests,
        fulfilled: stats.totalRequests - stats.openRequests,
      },
    ]
    return base.map(row => ({
      ...row,
      donations: Math.round(row.donations * combinedShare),
      requests: Math.round(row.requests * combinedShare),
      fulfilled: Math.round(row.fulfilled * combinedShare),
    }))
  }, [weeklyBookings, stats.totalRequests, stats.openRequests, combinedShare])

  const toggleBloodType = (bt: string) => {
    setSelectedBloodType(prev => prev === bt ? null : bt)
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">{t('dashboard')}</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={() => { setLoading(true); loadDashboardData() }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline/20 bg-surface-container/50 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-xs font-medium cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
            {t('refresh')}
          </button>
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/20"
            style={{ background: 'rgba(13,148,136,0.08)' }}>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: '#0D9488', animation: 'dot-pulse 2s ease-in-out infinite' }}
            />
            <span className="text-xs font-semibold" style={{ color: '#2DD4BF' }}>{t('live')}</span>
          </div>
        </div>
      </div>

      {/* Active filter indicator */}
      {(selectedBloodType || selectedDay) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-on-surface-variant">{t('filteredBy')}</span>
          {selectedBloodType && (
            <button
              onClick={() => setSelectedBloodType(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-all hover:opacity-80"
              style={{
                background: `${BLOOD_TYPE_COLORS[selectedBloodType]}15`,
                borderColor: `${BLOOD_TYPE_COLORS[selectedBloodType]}30`,
                color: BLOOD_TYPE_COLORS[selectedBloodType],
              }}
            >
              {selectedBloodType}
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            </button>
          )}
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border cursor-pointer transition-all hover:opacity-80 bg-secondary/10 border-secondary/30 text-secondary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_month</span>
              {selectedDay}
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
            </button>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div
            key={card.labelKey}
            className="glass-card rounded-2xl p-5 border border-outline relative overflow-hidden cursor-default transition-all duration-200 hover:border-outline-variant"
            style={{ ...glass, borderTop: `2px solid ${card.color}` }}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl pointer-events-none"
              style={{ background: card.glow }}
            />
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
              style={{ background: card.glow }}
            >
              <span
                className="material-symbols-outlined text-base"
                style={{ color: card.color, fontVariationSettings: "'FILL' 1" }}
              >
                {card.icon}
              </span>
            </div>
            <p className="font-mono font-semibold text-3xl text-on-surface leading-none">
              {loading
                ? <span className="inline-block w-12 h-8 bg-surface-container-high rounded animate-pulse" />
                : card.value}
            </p>
            <p className="text-xs font-medium text-on-surface-variant mt-2">{t(card.labelKey)}</p>
          </div>
        ))}
      </div>

      {/* Blood Type Inventory */}
      <div
        className="glass-card rounded-2xl p-6 border border-outline relative overflow-hidden"
        style={glass}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline font-bold text-base text-on-surface">{t('bloodTypeInventory')}</h2>
          <div className="flex items-center gap-3">
            {selectedBloodType && (
              <button
                onClick={() => setSelectedBloodType(null)}
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
              >
                {t('allBloodTypes')}
              </button>
            )}
            <span className="text-xs text-on-surface-variant">{t('unitsAvailable')}</span>
          </div>
        </div>

        {inventory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {ALL_BLOOD_TYPES.map(bt => {
              const item = inventory.find(i => i.blood_type === bt)
              const units = item?.units ?? 0
              const color = BLOOD_TYPE_COLORS[bt]
              const pct = maxInventory > 0 ? Math.round((units / maxInventory) * 100) : 0
              const isLow = units < 10
              const isSelected = selectedBloodType === bt
              const isDimmed = selectedBloodType && !isSelected
              return (
                <div
                  key={bt}
                  className={`flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1.5 transition-all duration-200 ${
                    isSelected ? 'ring-1 ring-primary/30 bg-primary/5' : 'hover:bg-surface-container'
                  } ${isDimmed ? 'opacity-30' : ''}`}
                  onClick={() => toggleBloodType(bt)}
                >
                  <span className="font-mono font-bold text-xs w-8 text-right flex-shrink-0" style={{ color }}>
                    {bt}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface-container-high">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
                    />
                  </div>
                  <span className={`font-mono text-xs w-5 text-right flex-shrink-0 ${isLow ? 'text-error' : 'text-on-surface-variant'}`}>
                    {units}
                  </span>
                  {isLow
                    ? <span className="text-[9px] font-bold text-error uppercase tracking-wider w-6 flex-shrink-0">{t('low')}</span>
                    : <span className="w-6 flex-shrink-0" />
                  }
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
            {ALL_BLOOD_TYPES.map(bt => (
              <div key={bt} className="flex items-center gap-3">
                <span className="font-mono text-xs w-8 text-right text-on-surface-variant/30 flex-shrink-0">{bt}</span>
                <div className="flex-1 h-1.5 rounded-full animate-pulse bg-surface-container-high" />
                <span className="font-mono text-xs w-5 text-on-surface-variant/20 flex-shrink-0">—</span>
                <span className="w-6 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Bookings Chart */}
      <div
        className="glass-card rounded-2xl p-6 border border-outline relative overflow-hidden"
        style={glass}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-headline font-bold text-base text-on-surface">{t('weeklyBookings')}</h2>
          {selectedBloodType && (
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
              style={{
                color: BLOOD_TYPE_COLORS[selectedBloodType],
                background: `${BLOOD_TYPE_COLORS[selectedBloodType]}15`,
              }}
            >
              {selectedBloodType}
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={filteredWeeklyBookings} barSize={36} barCategoryGap="30%">
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface-container-high)',
                border: '1px solid var(--color-outline)',
                borderRadius: '12px',
                fontSize: '13px',
                padding: '8px 12px',
                color: 'var(--color-on-surface)',
              }}
              labelStyle={{ color: 'var(--color-on-surface)', fontWeight: 600 }}
              itemStyle={{ color: selectedBloodType ? BLOOD_TYPE_COLORS[selectedBloodType] : '#E11D48' }}
              cursor={{ fill: 'var(--color-outline-variant)', radius: 6 }}
            />
            <Bar
              dataKey="bookings"
              radius={[6, 6, 0, 0]}
              onClick={(_data: unknown, index: number) => {
                const day = filteredWeeklyBookings[index]?.day
                if (day) setSelectedDay(prev => prev === day ? null : day)
              }}
              style={{ cursor: 'pointer' }}
            >
              {filteredWeeklyBookings.map((entry, index) => {
                const isDaySelected = selectedDay === entry.day
                const activeColor = selectedBloodType ? BLOOD_TYPE_COLORS[selectedBloodType] : '#E11D48'
                return (
                  <Cell
                    key={index}
                    fill={isDaySelected ? activeColor : 'var(--color-surface-container-high)'}
                    stroke={isDaySelected ? `${activeColor}99` : 'var(--color-outline)'}
                    strokeWidth={isDaySelected ? 2 : 1}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {selectedDay && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">{selectedDay}:</span>
            <span className="text-xs font-bold text-on-surface">
              {filteredWeeklyBookings.find(d => d.day === selectedDay)?.bookings ?? 0} {t('bookings')}
            </span>
            <button onClick={() => setSelectedDay(null)} className="text-xs text-primary hover:underline cursor-pointer ml-auto">
              {t('clearFilter')}
            </button>
          </div>
        )}
      </div>

      {/* Activity Trend — Area Chart */}
      <div
        className="glass-card rounded-2xl p-6 border border-outline relative overflow-hidden"
        style={glass}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="font-headline font-bold text-base text-on-surface">{t('activityTrend')}</h2>
              <p className="text-xs text-on-surface-variant mt-0.5">{t('activityTrendDesc')}</p>
            </div>
            {selectedBloodType && (
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ml-2"
                style={{
                  color: BLOOD_TYPE_COLORS[selectedBloodType],
                  background: `${BLOOD_TYPE_COLORS[selectedBloodType]}15`,
                }}
              >
                {selectedBloodType}
              </span>
            )}
            {selectedDay && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 bg-secondary/10 text-secondary">
                {selectedDay}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
            {[
              { labelKey: 'donations', color: '#10B981' },
              { labelKey: 'requests',  color: '#E11D48' },
              { labelKey: 'fulfilled', color: '#3B82F6' },
            ].map(s => (
              <div key={s.labelKey} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                {t(s.labelKey)}
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="gDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E11D48" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gFulfilled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline)" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant)' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface-container-high)',
                border: '1px solid var(--color-outline)',
                borderRadius: '12px',
                fontSize: '12px',
                padding: '10px 14px',
                color: 'var(--color-on-surface)',
              }}
              labelStyle={{ color: 'var(--color-on-surface)', fontWeight: 600 }}
              cursor={{ stroke: 'var(--color-outline)', strokeWidth: 1 }}
            />
            <Area type="monotone" dataKey="donations" stroke="#10B981" strokeWidth={2} fill="url(#gDonations)" dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="requests"  stroke="#E11D48" strokeWidth={2} fill="url(#gRequests)"  dot={{ r: 4, fill: '#E11D48', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="fulfilled" stroke="#3B82F6" strokeWidth={2} fill="url(#gFulfilled)" dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Blood Type Distribution — Donut Chart */}
      {donutData.length > 0 && (
        <div
          className="glass-card rounded-2xl p-6 border border-outline relative overflow-hidden"
          style={glass}
        >
          <h2 className="font-headline font-bold text-base text-on-surface mb-5">{t('bloodTypeDistribution')}</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                onClick={(data) => {
                  if (data?.name) toggleBloodType(data.name)
                }}
                style={{ cursor: 'pointer' }}
              >
                {donutData.map((entry, index) => {
                  const isDimmed = selectedBloodType && selectedBloodType !== entry.name
                  return (
                    <Cell
                      key={index}
                      fill={entry.fill}
                      stroke={selectedBloodType === entry.name ? entry.fill : 'none'}
                      strokeWidth={selectedBloodType === entry.name ? 3 : 0}
                      opacity={isDimmed ? 0.25 : 1}
                    />
                  )
                })}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-container-high)',
                  border: '1px solid var(--color-outline)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  padding: '10px 14px',
                  color: 'var(--color-on-surface)',
                }}
                formatter={(value, name) => [`${value} units`, name as string]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'Fira Code, monospace' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
