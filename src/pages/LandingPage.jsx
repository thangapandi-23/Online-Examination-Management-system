import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MdSchool, MdQuiz, MdSpeed, MdPeople, MdBarChart, MdSecurity, MdCheckCircle } from 'react-icons/md'

const features = [
  { icon: MdSecurity,  title: 'Secure Login',         desc: 'Role-based authentication for admins, teachers, and students.' },
  { icon: MdQuiz,      title: 'Online Exams',          desc: 'Create and attend MCQ, True/False, and short-answer exams.' },
  { icon: MdSpeed,     title: 'Instant Results',       desc: 'Automatic grading with grades published seconds after submission.' },
  { icon: MdPeople,    title: 'Student Management',    desc: 'Easily manage student profiles, attendance, and performance.' },
  { icon: MdBarChart,  title: 'Analytics Dashboard',   desc: 'Visual charts and reports for comprehensive performance insights.' },
  { icon: MdCheckCircle,title:'Auto Evaluation',       desc: 'Objective questions graded automatically with accurate scoring.' },
]

const stats = [
  { value: '1000+', label: 'Students Supported' },
  { value: '100%',  label: 'Auto-Grading Accuracy' },
  { value: '<5s',   label: 'Result Generation' },
  { value: '99%',   label: 'System Uptime' },
]

export default function LandingPage() {
  const { user } = useAuth()
  const targetPath = user ? '/dashboard' : '/login'
  const buttonLabel = user ? 'Dashboard' : 'Login'

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <MdSchool className="text-white text-xl" />
            </div>
            <span className="font-bold text-gray-900 text-lg">OEMS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
            <a href="#stats" className="hover:text-primary-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-primary-600 transition-colors">Contact</a>
          </div>
          <Link
            to={targetPath}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {buttonLabel}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100 rounded-full blur-2xl opacity-40 translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
          {/* Left */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
              Modern Education Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Conduct Online Exams{' '}
              <span className="text-primary-600">Efficiently</span> &{' '}
              <span className="text-primary-600">Securely</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed mb-8 max-w-lg">
              Create exams, manage students, publish results, and monitor performance from one centralized platform designed for modern education.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to={targetPath}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {user ? 'Go to Dashboard →' : 'Get Started →'}
              </Link>
              <a
                href="#features"
                className="bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-400 font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-200"
              >
                Learn More
              </a>
            </div>
            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-gray-100">
              {['Free to Start', 'Secure & Private', 'Instant Results'].map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-gray-500">
                  <MdCheckCircle className="text-primary-600 text-lg" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Illustration */}
          <div className="relative animate-fade-in hidden lg:block">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              {/* Mock Dashboard */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 bg-gray-100 rounded-full h-5 ml-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Students', value: '520', color: 'bg-blue-100 text-blue-600' },
                  { label: 'Exams',    value: '48',  color: 'bg-green-100 text-green-600' },
                  { label: 'Teachers', value: '32',  color: 'bg-purple-100 text-purple-600' },
                  { label: 'Results',  value: '1.2k',color: 'bg-orange-100 text-orange-600' },
                ].map(c => (
                  <div key={c.label} className={`${c.color} rounded-xl p-4`}>
                    <p className="text-xs font-medium opacity-70">{c.label}</p>
                    <p className="text-2xl font-bold mt-1">{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">Recent Exam Results</p>
                {[
                  { name: 'Ahmed Khan',    grade: 'A+', pct: '95%', bar: 95 },
                  { name: 'Sara Ahmed',    grade: 'B+', pct: '75%', bar: 75 },
                  { name: 'Umar Farooq',  grade: 'A',  pct: '84%', bar: 84 },
                ].map(s => (
                  <div key={s.name} className="flex items-center gap-3 mb-3 last:mb-0">
                    <div className="w-7 h-7 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                      {s.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-medium text-gray-600 mb-1">
                        <span>{s.name}</span>
                        <span className="text-primary-600">{s.grade}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${s.bar}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-primary-600 rounded-xl px-4 py-3">
                <span className="text-white text-sm font-semibold">Mathematics Exam</span>
                <span className="text-primary-100 text-xs font-medium">Live Now •</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-bold text-white mb-2">{s.value}</p>
                <p className="text-primary-100 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              A complete platform for managing online examinations from creation to result publication.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map(f => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-8 shadow-card border border-gray-100 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="text-primary-600 text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-primary-600 to-emerald-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 text-xl mb-8">Join thousands of educators and students already using OEMS.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-primary-50 font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 shadow-lg"
          >
            Login to Your Account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-sidebar text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
                <MdSchool className="text-white" />
              </div>
              <span className="font-bold text-white">OEMS</span>
              <span className="text-slate-500">— Online Examination Management System</span>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm">
            © {new Date().getFullYear()} OEMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
