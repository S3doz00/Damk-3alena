import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'

interface User {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  role: string
  created_at: string
}

interface Facility {
  id: string
  name: string
  city: string | null
}

export default function UserManagement() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState('')
  const [currentRole, setCurrentRole] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
    supabase.from('facilities').select('id, name, city').then(({ data }) => {
      if (data) setFacilities(data)
    })
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('role').eq('auth_id', user.id).maybeSingle()
      if (data?.role) setCurrentRole(data.role)
    })()
  }, [])

  const isAdmin = currentRole === 'admin'

  async function loadUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setUsers(data)
    setLoading(false)
  }

  async function updateRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
  }

  const roleColors: Record<string, string> = {
    donor: 'bg-primary/10 text-primary',
    staff: 'bg-secondary/10 text-secondary',
    admin: 'bg-tertiary-container/10 text-tertiary-container',
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
            {t('userManagement')}
          </h1>
          <p className="text-on-surface-variant text-sm">{t('userManagementDesc')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex-shrink-0 flex items-center gap-2 bg-primary text-on-primary font-semibold px-4 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(141,0,41,0.2)] hover:shadow-[0_8px_24px_rgba(141,0,41,0.3)] active:scale-[0.98] transition-all text-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            {t('createUser')}
          </button>
        )}
      </div>

      {toast && (
        <div className="bg-secondary-container/30 text-secondary px-4 py-3 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {toast}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-on-surface-variant">{t('loading')}</div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div
              key={user.id}
              className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-outline-variant/10 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-on-surface">
                  {user.first_name} {user.last_name}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {user.email || user.phone} &middot; {t('joined')} {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  (['donor', 'staff', 'admin'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => updateRole(user.id, role)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                        user.role === role
                          ? roleColors[role]
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {t(`role_${role}`)}
                    </button>
                  ))
                ) : (
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${roleColors[user.role] || 'bg-surface-container-low text-on-surface-variant'}`}>
                    {t(`role_${user.role}`)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateUserModal
          facilities={facilities}
          onClose={() => setShowCreate(false)}
          onSuccess={(msg) => {
            setToast(msg)
            setShowCreate(false)
            loadUsers()
            setTimeout(() => setToast(''), 4000)
          }}
        />
      )}
    </div>
  )
}

interface CreateUserModalProps {
  facilities: Facility[]
  onClose: () => void
  onSuccess: (message: string) => void
}

function CreateUserModal({ facilities, onClose, onSuccess }: CreateUserModalProps) {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff' as 'donor' | 'staff' | 'admin',
    facility_id: '',
    position: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload: Record<string, unknown> = {
      email: form.email,
      password: form.password,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || undefined,
      role: form.role,
    }
    if (form.role === 'staff') {
      payload.facility_id = form.facility_id
      payload.position = form.position || undefined
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      setError('Not signed in')
      return
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`
    let resp: Response
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
      })
    } catch (e) {
      setLoading(false)
      setError(`Network error: ${(e as Error).message}`)
      return
    }

    const body = await resp.json().catch(() => ({} as { error?: string }))
    setLoading(false)
    if (!resp.ok) {
      setError(body.error || `HTTP ${resp.status}`)
      return
    }
    onSuccess(t('userCreated'))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-xl text-on-surface mb-1">
              {t('createUserTitle')}
            </h2>
            <p className="text-xs text-on-surface-variant">{t('createUserDesc')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">{t('firstName')}</label>
              <input
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-3 text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface-variant">{t('lastName')}</label>
              <input
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-3 text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">{t('email')}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-3 text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">{t('passwordLabel')}</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-3 text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">{t('phoneOptional')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-3 text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-on-surface-variant">{t('role')}</label>
            <div className="flex gap-2">
              {(['donor', 'staff', 'admin'] as const).map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all ${
                    form.role === r
                      ? r === 'admin'
                        ? 'bg-tertiary-container/20 text-tertiary-container'
                        : r === 'staff'
                        ? 'bg-secondary text-on-secondary'
                        : 'bg-primary text-on-primary'
                      : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {t(`role_${r}`)}
                </button>
              ))}
            </div>
          </div>

          {form.role === 'staff' && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">{t('facilityLabel')}</label>
                <select
                  required
                  value={form.facility_id}
                  onChange={(e) => setForm({ ...form, facility_id: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-3 text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('selectFacilityFirst')}</option>
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}{f.city ? ` — ${f.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant">{t('positionOptional')}</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  placeholder="e.g. Nurse, Technician"
                  className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-3 text-sm text-on-surface font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-outline/60"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-error-container/20 text-error px-4 py-3 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary text-on-primary shadow-[0_4px_16px_rgba(141,0,41,0.2)] hover:shadow-[0_8px_24px_rgba(141,0,41,0.3)] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? t('creating') : t('createUser')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
