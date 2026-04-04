import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function About() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const TEAM = [
    { name: 'Saad Abulehyah', role: 'Team Lead & Full-Stack', icon: 'code' },
    { name: 'AI Engine', role: 'ML Forecasting & Matching', icon: 'smart_toy' },
    { name: 'Supabase', role: 'Backend & Realtime', icon: 'database' },
  ]

  const FEATURES = [
    { icon: 'psychology',     titleKey: 'feat1Title', descKey: 'feat1Desc', color: '#E11D48' },
    { icon: 'share_location', titleKey: 'feat2Title', descKey: 'feat2Desc', color: '#7C3AED' },
    { icon: 'local_hospital', titleKey: 'feat3Title', descKey: 'feat3Desc', color: '#0D9488' },
    { icon: 'smartphone',     titleKey: 'feat4Title', descKey: 'feat4Desc', color: '#2563EB' },
    { icon: 'crisis_alert',   titleKey: 'feat5Title', descKey: 'feat5Desc', color: '#F59E0B' },
    { icon: 'monitoring',     titleKey: 'feat6Title', descKey: 'feat6Desc', color: '#10B981' },
  ]

  const STATS = [
    { value: '8',   labelKey: 'statBloodTypes' },
    { value: '4',   labelKey: 'statWeeks' },
    { value: '24/7',labelKey: 'statRealtime' },
    { value: 'AI',  labelKey: 'statAI' },
  ]

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="about-orb about-orb-1" />
        <div className="about-orb about-orb-2" />
        <div className="about-orb about-orb-3" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-primary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_hospital
            </span>
          </div>
          <span className="font-headline font-extrabold text-lg tracking-tight">
            Damk <span className="text-primary">3alena</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="about-glass-btn px-6 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
        >
          {t('dashboardLogin')}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Badge */}
        <div className="about-glass-badge inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <span className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant">
            {t('heroBadge')}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-headline font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.9] mb-6 about-fade-in">
          {t('heroTitle1')}
          <br />
          <span className="about-gradient-text">{t('heroTitle2')}</span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-on-surface-variant leading-relaxed mb-10 about-fade-in about-delay-1">
          {t('heroDesc')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 about-fade-in about-delay-2">
          <button
            onClick={() => navigate('/login')}
            className="group inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold text-base transition-all hover:shadow-[0_8px_32px_rgba(225,29,72,0.3)] hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('openDashboard')}
            <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>
          <a
            href="#features"
            className="about-glass-btn inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">explore</span>
            {t('exploreFeatures')}
          </a>
        </div>

        {/* Stats Row */}
        <div className="about-glass-card mt-16 grid grid-cols-2 md:grid-cols-4 gap-0 rounded-3xl overflow-hidden max-w-3xl w-full about-fade-in about-delay-3">
          {STATS.map((stat, i) => (
            <div
              key={stat.labelKey}
              className={`flex flex-col items-center justify-center py-7 px-4 ${
                i < STATS.length - 1 ? 'border-r border-white/[0.06]' : ''
              }`}
            >
              <span className="font-mono font-bold text-3xl text-on-surface">{stat.value}</span>
              <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium mt-1">
                {t(stat.labelKey)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight mb-3">
              {t('builtForImpact')} <span className="about-gradient-text">{t('builtForImpact2')}</span>
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              {t('builtForDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.titleKey}
                className="about-glass-card group rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-1"
                style={{ borderTop: `2px solid ${f.color}` }}
              >
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: f.color + '30' }}
                />
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: f.color + '18' }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: f.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {f.icon}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-base text-on-surface mb-2">{t(f.titleKey)}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Tech Section */}
      <section className="relative z-10 px-6 md:px-12 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight mb-3">
              {t('poweredBy')} <span className="about-gradient-text">{t('poweredBy2')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TEAM.map((tm) => (
              <div
                key={tm.name}
                className="about-glass-card rounded-2xl p-6 border border-white/[0.06] text-center transition-all duration-300 hover:border-white/[0.12] hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span
                    className="material-symbols-outlined text-primary text-2xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {tm.icon}
                  </span>
                </div>
                <h3 className="font-headline font-bold text-on-surface mb-1">{tm.name}</h3>
                <p className="text-xs text-on-surface-variant">{tm.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="about-glass-card max-w-4xl mx-auto rounded-3xl p-10 md:p-14 text-center border border-white/[0.06] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent pointer-events-none" />
          <div className="relative z-10">
            <span
              className="material-symbols-outlined text-primary text-4xl mb-4 block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              volunteer_activism
            </span>
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight mb-3">
              {t('readyTitle')}
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
              {t('readyDesc')}
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold transition-all hover:shadow-[0_8px_32px_rgba(225,29,72,0.3)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('goToDashboard')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-6 text-center">
        <p className="text-xs text-on-surface-variant/50 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-sm">favorite</span>
          {t('footerText')}
        </p>
      </footer>
    </div>
  )
}
