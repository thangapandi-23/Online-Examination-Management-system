import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getExamById, getQuestions } from '../../services/examService'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { formatDuration, formatDateTime } from '../../utils/formatters'
import { MdPlayArrow, MdInfo, MdTimer, MdQuiz } from 'react-icons/md'

export default function ExamInstructionsPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [alreadyAttempted, setAlreadyAttempted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getExamById(examId),
      getQuestions(examId),
      supabase.from('exam_attempts').select('*').eq('student_id', user.id).eq('exam_id', examId).single(),
    ]).then(([e, qs, { data: attempt }]) => {
      setExam(e)
      setQuestions(qs || [])
      if (attempt && attempt.status !== 'In Progress') setAlreadyAttempted(true)
      setLoading(false)
    })
  }, [examId, user])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface"><Spinner size="lg" /></div>

  if (!exam) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Exam not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-emerald-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MdQuiz className="text-2xl" />
            </div>
            <span className="text-primary-100 text-sm font-medium">Examination</span>
          </div>
          <h1 className="text-2xl font-bold">{exam.exam_title}</h1>
          {exam.courses?.course_name && (
            <p className="text-primary-100 mt-1">{exam.courses.course_name}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-b border-gray-100">
          {[
            { icon: MdTimer, label: 'Duration', value: formatDuration(exam.duration) },
            { icon: MdQuiz, label: 'Questions', value: questions.length },
            { label: 'Total Marks', value: exam.total_marks },
          ].map((s, i) => (
            <div key={i} className="p-5 text-center border-r border-gray-100 last:border-r-0">
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-4">
            <MdInfo className="text-primary-600 text-xl" />
            <h2 className="font-bold text-gray-800">Instructions</h2>
          </div>
          <div className="space-y-3">
            {[
              'Read each question carefully before selecting your answer.',
              `You have ${formatDuration(exam.duration)} to complete this exam.`,
              'Do not refresh the page during the exam.',
              'The exam will auto-submit when time expires.',
              'Confirm your answers before clicking Submit.',
              ...(exam.instructions ? [exam.instructions] : []),
            ].map((ins, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                {ins}
              </div>
            ))}
          </div>

          {alreadyAttempted ? (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
              <p className="text-blue-700 font-semibold mb-3">You have already submitted this exam.</p>
              <Button variant="secondary" onClick={() => navigate(`/student/exam/${examId}/result`)}>
                View Your Result →
              </Button>
            </div>
          ) : questions.length === 0 ? (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
              <p className="text-yellow-700 font-semibold">No questions have been added to this exam yet.</p>
            </div>
          ) : (
            <div className="mt-8 flex gap-4">
              <Button variant="ghost" onClick={() => navigate('/student/exams')}>Go Back</Button>
              <Button
                variant="primary"
                className="flex-1 justify-center"
                icon={<MdPlayArrow />}
                onClick={() => navigate(`/student/exam/${examId}/take`)}
              >
                Start Exam Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
