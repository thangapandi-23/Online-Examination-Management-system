import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId, userObj = null) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (!error && data) {
        setProfile(data)
        setRole(data.role)
        return data
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
    }
    // Fallback if public.users record isn't found or RLS restricts
    const fallbackRole = userObj?.user_metadata?.role || user?.user_metadata?.role || 'admin'
    setRole(fallbackRole)
    setProfile({ id: userId, email: userObj?.email || user?.email, full_name: userObj?.user_metadata?.full_name || 'User', role: fallbackRole })
    return null
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id, session.user).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id, session.user)
        } else {
          setUser(null)
          setProfile(null)
          setRole(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data?.user) {
      setUser(data.user)
      await fetchProfile(data.user.id, data.user)
    }
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setRole(null)
  }

  const refreshProfile = () => {
    if (user) return fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
