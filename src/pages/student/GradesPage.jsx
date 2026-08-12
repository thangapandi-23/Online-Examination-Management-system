import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStudentResults } from '../../services/examService'
import { gradeColor } from '../../utils/gradeCalculator'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ProgressBar from '../../components/ui/ProgressBar'
import { formatDateTime } from '../../utils/formatters'
import { Link } from 'react-router-dom'

export default function GradesPage() {
  const { user } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    if (user) {
      getStudentResults(user.id).then(r => {
        if (isMounted) {
          setResults(r || [])
          setLoading(false)
        }
      }).catch(() => {
        if (isMounted) setLoading(false)
      })
    } else {
      setLoading(false)
    }
    return () => { isMounted = false }
  }, [user])

  const avg = results.length
    ? (results.reduce((a, r) => a + parseFloat(r.percentage), 0) / results.length).toFixed(1)
    : null

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Grades</h1>
        <p className="text-gray-500 text-sm mt-1">{results.length} examinations completed</p>
      </div>

      {avg && (
        <div className="bg-gradient-to-r from-primary-600 to-emerald-600 rounded-2xl p-6 text-white">
          <p className="text-primary-100 text-sm font-medium">Overall Average</p>
          <p className="text-4xl font-bold mt-1">{avg}%</p>
          <ProgressBar value={parseFloat(avg)} max={100} color="green" size="sm" className="mt-3" />
        </div>
      )}

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-500 font-medium">No exam results yet.</p>
          <p className="text-gray-400 text-sm mt-1">Complete an exam to see your grades here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map(r => (
            <div key={r.result_id} className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{r.exams?.exam_title}</p>
                {r.exams?.courses && (
                  <p className="text-sm text-gray-500 mt-0.5">{r.exams.courses.course_name}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatDateTime(r.published_at)}</p>
                <div className="mt-3">
                  <ProgressBar
                    value={r.percentage}
                    max={100}
                    color={r.grade === 'F' ? 'red' : r.percentage >= 70 ? 'green' : 'yellow'}
                    size="sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{r.obtained_marks}/{r.total_marks} marks ({r.percentage}%)</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-4xl font-bold ${gradeColor(r.grade)}`}>{r.grade}</div>
                <Badge label={r.status} />
                <Link
                  to={`/student/exam/${r.exam_id}/result`}
                  className="block mt-2 text-xs text-primary-600 hover:underline font-medium"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
