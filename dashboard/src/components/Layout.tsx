import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme, type ThemeMode } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const NAV_ITEMS = [
  { to: '/', labelKey: 'dashboard', icon: 'dashboard' },
  { to: '/create-request', labelKey: 'createRequest', icon: 'add_circle' },
  { to: '/appointments', labelKey: 'appointments', icon: 'calendar_month' },
  { to: '/requests', labelKey: 'requests', icon: 'list_alt' },
  { to: '/ai-outputs', labelKey: 'aiInsights', icon: 'psychology' },
]

const ADMIN_ITEMS = [
  { to: '/admin/users', labelKey: 'userManagement', icon: 'manage_accounts' },
  { to: '/admin/settings', labelKey: 'systemSettings', icon: 'settings' },
]

const THEME_OPTIONS: { mode: ThemeMode; labelKey: string; icon: string }[] = [
  { mode: 'light', labelKey: 'themeLight',  icon: 'light_mode' },
  { mode: 'dark',  labelKey: 'themeDark',   icon: 'dark_mode' },
  { mode: 'system',labelKey: 'themeSystem', icon: 'brightness_auto' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { themeMode, setThemeMode } = useTheme()
  const { lang, setLang, t } = useLanguage()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-surface border-r border-outline flex flex-col">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-outline">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 0 20px rgba(225, 29, 72, 0.35)' }}
            >
              <span
                className="material-symbols-outlined text-on-primary"
                style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
              >
                water_drop
              </span>
            </div>
            <div>
              <h1 className="font-headline font-bold text-base text-on-surface tracking-tight leading-tight">
                Damk 3alena
              </h1>
              <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">
                Blood Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer border-l-2 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent'
                }`
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}

          <div className="pt-5 pb-1.5 px-3">
            <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
              {t('adminLabel')}
            </p>
          </div>

          {ADMIN_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer border-l-2 ${
                  isActive
                    ? 'bg-secondary/10 text-secondary border-secondary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent'
                }`
              }
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.icon}</span>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Language Switcher */}
        <div className="px-3 py-3 border-t border-outline">
          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest px-2 mb-2">
            {t('language')}
          </p>
          <div className="flex gap-1 p-1 bg-surface-container rounded-xl">
            {(['en', 'ar'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  lang === l
                    ? 'bg-surface text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="text-base">{l === 'en' ? '🇺🇸' : '🇸🇦'}</span>
                <span>{l === 'en' ? 'EN' : 'AR'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="px-3 py-3 border-t border-outline">
          <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest px-2 mb-2">
            {t('appearance')}
          </p>
          <div className="flex gap-1">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.mode}
                onClick={() => setThemeMode(opt.mode)}
                title={t(opt.labelKey)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                  themeMode === opt.mode
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{opt.icon}</span>
                <span className="text-[10px]">{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign Out */}
        <div className="px-3 py-3 border-t border-outline">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-error/10 hover:text-error transition-all duration-150 w-full cursor-pointer border-l-2 border-transparent"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-screen">
        <div className="p-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
