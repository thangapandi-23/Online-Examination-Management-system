import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  MdDashboard, MdPeople, MdSchool, MdAssignment, MdBarChart,
  MdSettings, MdLogout, MdMenu, MdClose, MdNotifications,
  MdBook, MdQuiz, MdGrade, MdPerson, MdCalendarToday,
  MdApartment, MdClass, MdSubject
} from 'react-icons/md'

const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard',   path: '/admin/dashboard',   icon: MdDashboard },
    { label: 'Students',    path: '/admin/students',    icon: MdPeople },
    { label: 'Teachers',    path: '/admin/teachers',    icon: MdSchool },
    { label: 'Departments', path: '/admin/departments', icon: MdApartment },
    { label: 'Courses',     path: '/admin/courses',     icon: MdClass },
    { label: 'Examinations',path: '/admin/exams',       icon: MdAssignment },
    { label: 'Results',     path: '/admin/results',     icon: MdGrade },
    { label: 'Reports',     path: '/admin/reports',     icon: MdBarChart },
    { label: 'Settings',    path: '/admin/settings',    icon: MdSettings },
  ],
  teacher: [
    { label: 'Dashboard',     path: '/teacher/dashboard', icon: MdDashboard },
    { label: 'My Profile',    path: '/teacher/profile',   icon: MdPerson },
    { label: 'My Students',   path: '/teacher/students',  icon: MdPeople },
    { label: 'Examinations',  path: '/teacher/exams',     icon: MdAssignment },
    { label: 'Results',       path: '/teacher/results',   icon: MdGrade },
    { label: 'Attendance',    path: '/teacher/attendance',icon: MdCalendarToday },
  ],
  student: [
    { label: 'Dashboard',   path: '/student/dashboard', icon: MdDashboard },
    { label: 'My Profile',  path: '/student/profile',   icon: MdPerson },
    { label: 'Online Exams',path: '/student/exams',     icon: MdQuiz },
    { label: 'My Grades',   path: '/student/grades',    icon: MdGrade },
  ],
}

const ROLE_LABELS = { admin: 'Administrator', teacher: 'Teacher', student: 'Student' }

export default function DashboardLayout({ role }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Welcome to OEMS', message: 'Logged in successfully with active session guard.', time: 'Just now', read: false },
    { id: 2, title: 'System Active', message: 'Online Examination Management System is live and ready.', time: 'Today', read: false },
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const navItems = NAV_ITEMS[role] || []

  const handleLogout = async () => {
    await signOut()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const displayName = (profile?.full_name && profile.full_name !== 'User')
    ? profile.full_name
    : (ROLE_LABELS[role] || 'Admin')

  const displayEmail = profile?.email || user?.email || ''

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'A'

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-sidebar flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <MdSchool className="text-white text-xl" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">OEMS</p>
              <p className="text-slate-400 text-xs mt-0.5">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <Icon className="text-lg flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-5 border-t border-slate-700 pt-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{displayName}</p>
              <p className="text-slate-400 text-xs truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-sm font-medium"
          >
            <MdLogout className="text-lg" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <MdMenu className="text-xl" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Online Examination Management System</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Notification Bell Button */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(prev => !prev)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none"
                title="Notifications"
              >
                <MdNotifications className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-fade-in">
                    <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-primary-600 hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {notifications.length === 0 ? (
                        <p className="text-gray-400 text-xs text-center py-6">No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 items-start ${
                              !n.read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-primary-600' : 'bg-transparent'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
