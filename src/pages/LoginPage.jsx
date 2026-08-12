import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { MdSchool, MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import Spinner from '../components/ui/Spinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, user, role } = useAuth()
  const navigate = useNavigate()

  // Auto-redirect if already signed in
  useEffect(() => {
    if (user && role) {
      if (role === 'admin') navigate('/admin/dashboard', { replace: true })
      else if (role === 'teacher') navigate('/teacher/dashboard', { replace: true })
      else if (role === 'student') navigate('/student/dashboard', { replace: true })
    }
  }, [user, role, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      await signIn(email, password)
      // Role-based redirect handled by AuthContext + AppRouter RoleRedirect
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 max-w-lg mx-auto lg:mx-0">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <MdSchool className="text-white text-xl" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base leading-none">OEMS</p>
              <p className="text-gray-400 text-xs">Online Examination System</p>
            </div>
          </Link>
        </div>

        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <MdVisibilityOff className="text-lg" /> : <MdVisibility className="text-lg" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button type="button" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            Contact your administrator to get your login credentials.
          </p>
        </div>
      </div>

      {/* Right — Illustration (desktop only) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 to-emerald-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 1 - i * 0.15,
              }}
            />
          ))}
        </div>
        <div className="relative text-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center mx-auto mb-8">
            <MdSchool className="text-white text-5xl" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Online Examination<br />Management System</h2>
          <p className="text-primary-100 text-lg max-w-sm mx-auto leading-relaxed">
            Conduct exams, manage students, and publish results — all from one secure platform.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { v: '3', l: 'User Roles' },
              { v: '100%', l: 'Auto Graded' },
              { v: '<5s', l: 'Results' },
            ].map(s => (
              <div key={s.l} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{s.v}</p>
                <p className="text-primary-200 text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
