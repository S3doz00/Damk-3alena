interface ProgressBarProps {
  current: number
  target: number
  label?: string
  unit?: string
  tone?: 'primary' | 'secondary' | 'tertiary' | 'error'
  showNumbers?: boolean
  compact?: boolean
}

const TONE_CLASSES: Record<NonNullable<ProgressBarProps['tone']>, { bar: string; text: string }> = {
  primary: { bar: 'bg-gradient-to-r from-primary to-primary-container', text: 'text-primary' },
  secondary: { bar: 'bg-gradient-to-r from-secondary to-secondary-container', text: 'text-secondary' },
  tertiary: { bar: 'bg-gradient-to-r from-tertiary to-tertiary-container', text: 'text-tertiary' },
  error: { bar: 'bg-gradient-to-r from-error to-error-container', text: 'text-error' },
}

export default function ProgressBar({
  current,
  target,
  label,
  unit = '',
  tone = 'primary',
  showNumbers = true,
  compact = false,
}: ProgressBarProps) {
  const safeTarget = Math.max(target, 1)
  const pct = Math.min(100, Math.round((current / safeTarget) * 100))
  const complete = current >= target
  const effectiveTone = complete ? 'secondary' : tone
  const toneClass = TONE_CLASSES[effectiveTone]

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {(label || showNumbers) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-on-surface-variant uppercase tracking-wider">{label}</span>}
          {showNumbers && (
            <span className={`${toneClass.text} tabular-nums`}>
              {current}
              <span className="text-on-surface-variant">/{target}{unit && ` ${unit}`}</span>
              <span className="text-on-surface-variant ml-2">({pct}%)</span>
            </span>
          )}
        </div>
      )}
      <div className={`w-full ${compact ? 'h-1.5' : 'h-2.5'} bg-surface-container rounded-full overflow-hidden`}>
        <div
          className={`h-full ${toneClass.bar} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
