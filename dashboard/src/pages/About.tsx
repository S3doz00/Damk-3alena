import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import {
  motion,
  useMotionValue,
  useSpring,
  useInView,
  useScroll,
  useTransform,
} from 'framer-motion'

// ── Animated counter hook ──
function useCounter(target: number, inView: boolean) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!inView) return
    let frame: number
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, inView])
  return count
}

// ── Section wrapper with scroll reveal ──
function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const, delay }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ── Stat card with animated number ──
function StatCard({ value, labelKey, index, t }: { value: string; labelKey: string; index: number; t: (k: string) => string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const numericValue = parseInt(value)
  const isNumeric = !isNaN(numericValue)
  const animatedCount = useCounter(isNumeric ? numericValue : 0, inView)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`flex flex-col items-center justify-center py-7 px-4 ${index < 3 ? 'border-r border-white/[0.06]' : ''}`}
    >
      <span className="font-mono font-bold text-3xl text-on-surface">
        {isNumeric ? animatedCount : value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-medium mt-1">
        {t(labelKey)}
      </span>
    </motion.div>
  )
}

// ── Team card with scroll reveal ──
function TeamCard({ tm, index }: { tm: { name: string; role: string; icon: string }; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="about-glass-card rounded-2xl p-6 border border-white/[0.06] text-center cursor-default"
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
    </motion.div>
  )
}

// ── Feature card with hover glow ──
function FeatureCard({ f, index, t }: { f: { icon: string; titleKey: string; descKey: string; color: string }; index: number; t: (k: string) => string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] as const }}
      whileHover={{
        y: -6,
        transition: { duration: 0.25 },
      }}
      className="about-glass-card group rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden cursor-default"
      style={{ borderTop: `2px solid ${f.color}` }}
    >
      {/* Hover glow orb */}
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: f.color + '25' }}
      />
      {/* Bottom glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${f.color}40, transparent)` }}
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
    </motion.div>
  )
}

// ── Main component ──
export default function About() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useLanguage()

  // Mouse tracking for parallax background
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 30 })
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 30 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2)
      mouseY.set(e.clientY - window.innerHeight / 2)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Scroll-based parallax for hero
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

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

  // Stagger variants
  const heroContainer = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  }
  const heroChild = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
  }

  return (
    <div className="min-h-screen bg-background text-on-surface overflow-hidden">

      {/* ── Mouse-reactive parallax background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary red orb — follows mouse gently */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(225,29,72,0.25) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '5%',
            left: '10%',
            x: useTransform(smoothX, v => v * 0.04),
            y: useTransform(smoothY, v => v * 0.03),
          }}
        />
        {/* Purple orb — inverse parallax */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
            bottom: '5%',
            right: '5%',
            x: useTransform(smoothX, v => v * -0.03),
            y: useTransform(smoothY, v => v * -0.025),
          }}
        />
        {/* Teal orb — slow drift */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '45%',
            left: '35%',
            x: useTransform(smoothX, v => v * 0.02),
            y: useTransform(smoothY, v => v * 0.04),
          }}
        />
        {/* Warm accent — subtle */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
            top: '20%',
            right: '20%',
            x: useTransform(smoothX, v => v * -0.05),
            y: useTransform(smoothY, v => v * 0.02),
          }}
        />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '128px 128px' }} />
      </div>

      {/* ── Navigation ── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
            className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center"
          >
            <span
              className="material-symbols-outlined text-primary text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_hospital
            </span>
          </motion.div>
          <span className="font-headline font-extrabold text-lg tracking-tight">
            Damk <span className="text-primary">3alena</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-white/[0.06] backdrop-blur-sm rounded-xl p-1 border border-white/[0.08]">
            {(['en', 'ar'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  lang === l
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-white/[0.06]'
                }`}
              >
                {l === 'en' ? 'EN' : 'عربي'}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
            className="about-glass-btn px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            {t('dashboardLogin')}
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 md:pt-24 md:pb-32"
      >
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div variants={heroChild} className="about-glass-badge inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-on-surface-variant">
              {t('heroBadge')}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={heroChild} className="font-headline font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.9] mb-6">
            {t('heroTitle1')}
            <br />
            <span className="about-gradient-text">{t('heroTitle2')}</span>
          </motion.h1>

          <motion.p variants={heroChild} className="max-w-2xl text-lg md:text-xl text-on-surface-variant leading-relaxed mb-10">
            {t('heroDesc')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={heroChild} className="flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(225,29,72,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              className="group inline-flex items-center justify-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold text-base transition-colors"
            >
              {t('openDashboard')}
              <motion.span
                className="material-symbols-outlined text-lg"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
              >
                arrow_forward
              </motion.span>
            </motion.button>
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="#features"
              className="about-glass-btn inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-colors"
            >
              <span className="material-symbols-outlined text-lg">explore</span>
              {t('exploreFeatures')}
            </motion.a>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            variants={heroChild}
            className="about-glass-card mt-16 grid grid-cols-2 md:grid-cols-4 gap-0 rounded-3xl overflow-hidden max-w-3xl w-full"
          >
            {STATS.map((stat, i) => (
              <StatCard key={stat.labelKey} value={stat.value} labelKey={stat.labelKey} index={i} t={t} />
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Features Grid ── */}
      <RevealSection className="relative z-10 px-6 md:px-12 pb-24" delay={0}>
        <div id="features" className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight mb-3">
              {t('builtForImpact')} <span className="about-gradient-text">{t('builtForImpact2')}</span>
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              {t('builtForDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.titleKey} f={f} index={i} t={t} />
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── Team / Tech Section ── */}
      <RevealSection className="relative z-10 px-6 md:px-12 pb-24" delay={0}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight mb-3">
              {t('poweredBy')} <span className="about-gradient-text">{t('poweredBy2')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TEAM.map((tm, i) => (
              <TeamCard key={tm.name} tm={tm} index={i} />
            ))}
          </div>
        </div>
      </RevealSection>

      {/* ── CTA Footer ── */}
      <RevealSection className="relative z-10 px-6 md:px-12 pb-20" delay={0}>
        <div className="about-glass-card max-w-4xl mx-auto rounded-3xl p-10 md:p-14 text-center border border-white/[0.06] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] to-transparent pointer-events-none" />
          {/* Pulsing glow behind CTA */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%)',
              animation: 'dot-pulse 3s ease-in-out infinite',
            }}
          />
          <div className="relative z-10">
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="material-symbols-outlined text-primary text-4xl mb-4 block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              volunteer_activism
            </motion.span>
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight mb-3">
              {t('readyTitle')}
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
              {t('readyDesc')}
            </p>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(225,29,72,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 bg-primary text-on-primary px-8 py-4 rounded-2xl font-bold transition-colors"
            >
              {t('goToDashboard')}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </motion.button>
          </div>
        </div>
      </RevealSection>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 px-6 text-center">
        <p className="text-xs text-on-surface-variant/50 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-sm">favorite</span>
          {t('footerText')}
        </p>
      </footer>
    </div>
  )
}
