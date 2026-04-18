import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme, type ThemeMode } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

const NAV_ITEMS = [
  { to: '/', labelKey: 'dashboard', icon: 'dashboard' },
  { to: '/create-request', labelKey: 'createRequest', icon: 'add_circle' },
  { to: '/appointments', labelKey: 'appointments', icon: 'calendar_month' },
  { to: '/requests', labelKey: 'requests', icon: 'list_alt' },
  { to: '/campaigns', labelKey: 'campaigns', icon: 'campaign' },
  { to: '/ai-outputs', labelKey: 'aiInsights', icon: 'psychology' },
  { to: '/blood-map', labelKey: 'bloodMap', icon: 'map' },
]

const ADMIN_ITEMS = [
  { to: '/admin/users', labelKey: 'userManagement', icon: 'manage_accounts', adminOnly: true },
  { to: '/admin/settings', labelKey: 'systemSettings', icon: 'settings', adminOnly: false },
  { to: '/profile', labelKey: 'editProfile', icon: 'person', adminOnly: false },
]

const THEME_OPTIONS: { mode: ThemeMode; labelKey: string; icon: string }[] = [
  { mode: 'light', labelKey: 'themeLight',  icon: 'light_mode' },
  { mode: 'dark',  labelKey: 'themeDark',   icon: 'dark_mode' },
  { mode: 'system',labelKey: 'themeSystem', icon: 'brightness_auto' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { themeMode, setThemeMode } = useTheme()
  const { lang, setLang, t } = useLanguage()
  const [role, setRole] = useState<'admin' | 'staff' | 'donor' | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('role').eq('auth_id', user.id).maybeSingle()
      if (active && data?.role) setRole(data.role as 'admin' | 'staff' | 'donor')
    })()
    return () => { active = false }
  }, [])

  const isAdmin = role === 'admin'
  const visibleAdminItems = ADMIN_ITEMS.filter(item => isAdmin || !item.adminOnly)
  const sectionLabelKey = isAdmin ? 'adminLabel' : 'staffLabel'

  // Blood Map uses full viewport — skip inner padding & max-width wrapper
  const fullBleed = location.pathname.startsWith('/blood-map')

  // Simple show/hide sidebar — click to toggle, no hover behavior
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return localStorage.getItem('sidebarOpen') !== 'false'
  })
  const collapsed = !sidebarOpen

  const toggleSidebar = () => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    localStorage.setItem('sidebarOpen', String(next))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }


  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 bg-surface border-r border-outline flex flex-col transition-all duration-300 overflow-hidden ${collapsed ? 'w-16' : 'w-60'}`}
      >

        {/* Logo + collapse toggle */}
        <div className={`py-5 border-b border-outline ${collapsed ? 'px-3' : 'px-5'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            {collapsed ? (
              /* Collapsed: logo icon doubles as expand button */
              <button
                onClick={toggleSidebar}
                title={t('lockSidebar')}
                className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                style={{ boxShadow: '0 0 20px rgba(225, 29, 72, 0.35)' }}
              >
                <span
                  className="material-symbols-outlined text-on-primary"
                  style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                >
                  water_drop
                </span>
              </button>
            ) : (
              /* Expanded: logo + title + collapse arrow */
              <>
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
                <div className="flex-1 min-w-0">
                  <h1 className="font-headline font-bold text-base text-on-surface tracking-tight leading-tight whitespace-nowrap">
                    Damk 3alena
                  </h1>
                  <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                    Blood Dashboard
                  </p>
                </div>
                <button
                  onClick={toggleSidebar}
                  title={t('unlockSidebar')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary hover:bg-primary hover:text-on-primary transition-all duration-200 cursor-pointer"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    left_panel_close
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-0.5 ${collapsed ? 'px-1.5' : 'px-3'}`}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={collapsed ? t(item.labelKey) : undefined}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${collapsed ? '' : 'border-l-2'} ${
                  isActive
                    ? `bg-primary/10 text-primary ${collapsed ? '' : 'border-primary'}`
                    : `text-on-surface-variant hover:bg-surface-container hover:text-on-surface ${collapsed ? '' : 'border-transparent'}`
                }`
              }
            >
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{t(item.labelKey)}</span>}
            </NavLink>
          ))}

          {!collapsed && (
            <div className="pt-5 pb-1.5 px-3">
              <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
                {t(sectionLabelKey)}
              </p>
            </div>
          )}
          {collapsed && <div className="pt-3" />}

          {visibleAdminItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? t(item.labelKey) : undefined}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${collapsed ? '' : 'border-l-2'} ${
                  isActive
                    ? `bg-secondary/10 text-secondary ${collapsed ? '' : 'border-secondary'}`
                    : `text-on-surface-variant hover:bg-surface-container hover:text-on-surface ${collapsed ? '' : 'border-transparent'}`
                }`
              }
            >
              <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{t(item.labelKey)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Language Switcher */}
        {!collapsed ? (
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
        ) : (
          <div className="px-1.5 py-3 border-t border-outline flex flex-col items-center gap-1">
            {(['en', 'ar'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                title={l === 'en' ? 'English' : 'العربية'}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all duration-150 cursor-pointer ${
                  lang === l
                    ? 'bg-primary/10 text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {l === 'en' ? '🇺🇸' : '🇸🇦'}
              </button>
            ))}
          </div>
        )}

        {/* Theme Toggle */}
        {!collapsed ? (
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
        ) : (
          <div className="px-1.5 py-3 border-t border-outline flex flex-col items-center gap-1">
            {THEME_OPTIONS.map(opt => (
              <button
                key={opt.mode}
                onClick={() => setThemeMode(opt.mode)}
                title={t(opt.labelKey)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                  themeMode === opt.mode
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{opt.icon}</span>
              </button>
            ))}
          </div>
        )}

        {/* Sign Out */}
        <div className={`py-3 border-t border-outline ${collapsed ? 'px-1.5' : 'px-3'}`}>
          <button
            onClick={handleSignOut}
            title={collapsed ? t('signOut') : undefined}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3 border-l-2 border-transparent'} py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-error/10 hover:text-error transition-all duration-150 w-full cursor-pointer`}
          >
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '18px' }}>logout</span>
            {!collapsed && t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 min-h-screen ${fullBleed ? 'overflow-hidden relative' : 'overflow-y-auto'}`}>
        {fullBleed ? (
          <Outlet />
        ) : (
          <div className="p-8 max-w-6xl">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  )
}
