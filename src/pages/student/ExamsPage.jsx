import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getExams, getStudentAttempts } from '../../services/examService'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDateTime, formatDuration } from '../../utils/formatters'
import { MdPlayArrow, MdVisibility } from 'react-icons/md'

export default function StudentExamsPage() {
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming') // 'upcoming' | 'completed'

  useEffect(() => {
    if (!user) return
    let isMounted = true
    Promise.all([
      getExams(),
      getStudentAttempts(user.id),
    ]).then(([allExams, studentAttempts]) => {
      if (isMounted) {
        setExams(allExams || [])
        setAttempts(studentAttempts || [])
        setLoading(false)
      }
    }).catch(err => {
      console.error('Load student exams error:', err)
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [user])

  const completedIds = new Set(
    attempts
      .filter(a => a.status === 'Submitted' || a.status === 'Timeout' || (a.status && a.status !== 'In Progress'))
      .map(a => a.exam_id)
  )

  const upcoming = exams.filter(e => e.status === 'Published' && !completedIds.has(e.exam_id))
  const completed = exams.filter(e => completedIds.has(e.exam_id))
  const current = tab === 'upcoming' ? upcoming : completed

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Online Exams</h1>
        <p className="text-gray-500 text-sm mt-1">View and attend your scheduled exams.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'completed', label: `Completed (${completed.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-4">{tab === 'upcoming' ? '📋' : '✅'}</p>
          <p className="text-gray-500 font-medium">{tab === 'upcoming' ? 'No upcoming exams.' : 'No completed exams yet.'}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {current.map(e => {
            const attempt = attempts.find(a => a.exam_id === e.exam_id)
            return (
              <div key={e.exam_id} className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{e.exam_title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{e.courses?.course_name || 'General'}</p>
                  </div>
                  <Badge label={attempt ? attempt.status : 'Not Started'} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="font-semibold text-gray-700">{formatDuration(e.duration)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Total Marks</p>
                    <p className="font-semibold text-gray-700">{e.total_marks}</p>
                  </div>
                  {e.start_time && (
                    <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-gray-400">Scheduled</p>
                      <p className="font-semibold text-gray-700 text-xs">{formatDateTime(e.start_time)}</p>
                    </div>
                  )}
                </div>
                {tab === 'upcoming' ? (
                  <Link to={`/student/exam/${e.exam_id}/instructions`} className="mt-auto">
                    <Button variant="primary" className="w-full justify-center" icon={<MdPlayArrow />}>
                      Start Exam
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/student/exam/${e.exam_id}/result`} className="mt-auto">
                    <Button variant="secondary" className="w-full justify-center" icon={<MdVisibility />}>
                      View Result
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
