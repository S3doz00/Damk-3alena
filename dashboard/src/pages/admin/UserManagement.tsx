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

export default function UserManagement() {
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

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
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      )
    }
  }

  const roleColors: Record<string, string> = {
    donor: 'bg-primary/10 text-primary',
    staff: 'bg-secondary/10 text-secondary',
    admin: 'bg-tertiary-container/10 text-tertiary-container',
  }

  return (
    <div>
      <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
        {t('userManagement')}
      </h1>
      <p className="text-on-surface-variant text-sm mb-8">
        {t('userManagementDesc')}
      </p>

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
                {(['donor', 'staff', 'admin'] as const).map(role => (
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
