import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getResultByStudentAndExam } from '../../services/examService'
import { gradeColor } from '../../utils/gradeCalculator'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { MdHome, MdRefresh, MdDownload } from 'react-icons/md'

export default function ResultPage() {
  const { examId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let isMounted = true
    getResultByStudentAndExam(user.id, examId).then(r => {
      if (isMounted) {
        setResult(r)
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [user, examId])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm animate-pulse-soft">Calculating your result...</p>
    </div>
  )

  if (!result) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <p className="text-gray-500 text-lg">Result not available yet.</p>
      <Button variant="primary" onClick={() => navigate('/student/dashboard')}>Go to Dashboard</Button>
    </div>
  )

  const isPassed = result.status === 'Pass'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6 animate-fade-in">
        {/* Result Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Status banner */}
          <div className={`p-8 text-center ${isPassed ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
            <div className="text-6xl mb-4">{isPassed ? '🎉' : '😔'}</div>
            <h1 className="text-3xl font-bold text-white">{isPassed ? 'Congratulations!' : 'Better Luck Next Time'}</h1>
            <p className="text-white/80 mt-2">{result.exams?.exam_title}</p>
          </div>

          {/* Score details */}
          <div className="p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="text-center">
                <div className={`text-8xl font-bold ${gradeColor(result.grade)}`}>{result.grade}</div>
                <p className="text-gray-400 text-sm mt-2">Grade</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Score', value: `${result.obtained_marks}/${result.total_marks}` },
                { label: 'Percentage', value: `${result.percentage}%` },
                { label: 'Status', value: result.status, colored: true },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className={`text-xl font-bold ${s.colored ? (isPassed ? 'text-green-600' : 'text-red-600') : 'text-gray-900'}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Grade scale reference */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">Grading Scale</p>
              <div className="grid grid-cols-7 gap-1">
                {[
                  { g: 'A+', r: '90-100' }, { g: 'A', r: '80-89' }, { g: 'B+', r: '70-79' },
                  { g: 'B', r: '60-69' }, { g: 'C', r: '50-59' }, { g: 'D', r: '40-49' }, { g: 'F', r: '<40' }
                ].map(({ g, r }) => (
                  <div key={g} className={`text-center p-2 rounded-lg ${result.grade === g ? 'bg-primary-600 text-white' : 'bg-white text-gray-500'}`}>
                    <p className="text-xs font-bold">{g}</p>
                    <p className="text-xs opacity-70 hidden sm:block">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link to="/student/exams" className="flex-1">
            <Button variant="secondary" className="w-full justify-center" icon={<MdHome />}>Back to Exams</Button>
          </Link>
          <Link to="/student/grades" className="flex-1">
            <Button variant="primary" className="w-full justify-center">My Grades →</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
