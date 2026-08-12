import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { getStudentResults } from '../../services/examService'
import { StatCard } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Link } from 'react-router-dom'
import { formatDateTime, formatDuration } from '../../utils/formatters'
import { gradeColor } from '../../utils/gradeCalculator'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { MdPlayArrow } from 'react-icons/md'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [resExams, resultData, resAttempts] = await Promise.all([
          supabase.from('exams').select('*,courses(course_name)').eq('status', 'Published'),
          getStudentResults(user.id).catch(() => []),
          supabase.from('exam_attempts').select('exam_id,status').eq('student_id', user.id),
        ])
        setExams(resExams?.data || [])
        setResults(resultData || [])
        setAttempts(resAttempts?.data || [])
      } catch (err) {
        console.error('Failed to load student dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const completedExamIds = new Set(attempts.filter(a => a.status !== 'In Progress').map(a => a.exam_id))
  const upcomingExams = exams.filter(e => !completedExamIds.has(e.exam_id))
  const avgGrade = results.length
    ? (results.reduce((a, r) => a + r.percentage, 0) / results.length).toFixed(1)
    : null

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Student Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Your upcoming exams and results.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon="📋" title="Upcoming Exams" value={upcomingExams.length} color="blue" />
        <StatCard icon="✅" title="Completed Exams" value={results.length} color="green" />
        <StatCard icon="📈" title="Average Score" value={avgGrade ? `${avgGrade}%` : '—'} color="purple" />
        <StatCard icon="🎯" title="Exams Available" value={exams.length} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming exams */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Available Exams</h2>
            <Link to="/student/exams" className="text-sm text-primary-600 hover:underline font-medium">View All →</Link>
          </div>
          {upcomingExams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No upcoming exams at the moment.</p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.slice(0, 4).map(e => (
                <div key={e.exam_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{e.exam_title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{e.courses?.course_name} • {formatDuration(e.duration)}</p>
                  </div>
                  <Link to={`/student/exam/${e.exam_id}/instructions`}>
                    <Button variant="primary" size="sm" icon={<MdPlayArrow />}>Start</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent results */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Recent Results</h2>
            <Link to="/student/grades" className="text-sm text-primary-600 hover:underline font-medium">View All →</Link>
          </div>
          {results.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No results yet. Take your first exam!</p>
          ) : (
            <div className="space-y-3">
              {results.slice(0, 4).map(r => (
                <div key={r.result_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.exams?.exam_title}</p>
                    <p className="text-xs text-gray-400">{r.obtained_marks}/{r.total_marks} marks • {r.percentage}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${gradeColor(r.grade)}`}>{r.grade}</span>
                    <Badge label={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
