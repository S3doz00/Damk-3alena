import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function Login() {
  const { t, lang, setLang } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background accents */}
      <div className="fixed -bottom-32 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-32 -right-32 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Back to landing */}
      <button
        onClick={() => navigate('/about')}
        className="fixed top-4 ltr:left-4 rtl:right-4 flex items-center gap-1.5 bg-surface-container-low rounded-xl px-3 py-1.5 border border-outline/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
      >
        <span className="material-symbols-outlined rtl:rotate-180" style={{ fontSize: '16px' }}>arrow_back</span>
        <span className="text-xs font-bold">{t('backToHome')}</span>
      </button>

      {/* Language toggle */}
      <div className="fixed top-4 ltr:right-4 rtl:left-4 flex items-center gap-1 bg-surface-container-low rounded-xl p-1 border border-outline/10">
        {(['en', 'ar'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lang === l
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {l === 'en' ? 'EN' : 'عربي'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto mb-5 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              local_hospital
            </span>
          </div>
          <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-2">
            {t('hospitalDashboard')}
          </h1>
          <p className="text-on-surface-variant font-body">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">
              {t('workEmail')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">mail</span>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-outline/60 font-medium"
                placeholder="staff@hospital.jo"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface-variant ml-1">
              {t('password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">lock</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:text-outline/60 font-medium"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold py-4 rounded-xl shadow-[0_8px_24px_rgba(141,0,41,0.15)] hover:shadow-[0_12px_32px_rgba(141,0,41,0.25)] active:scale-[0.98] transition-all duration-200 text-lg disabled:opacity-60"
          >
            {loading ? t('signingIn') : t('logIn')}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-on-surface-variant/50 flex items-center justify-center gap-1.5">
          <span className="material-symbols-outlined text-sm">shield_with_heart</span>
          {t('secureNetwork')}
        </p>
      </div>
    </div>
  )
}
