import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  getExamById, getQuestions, startAttempt, saveAnswer, submitExam
} from '../../services/examService'
import { formatTime } from '../../utils/formatters'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import ProgressBar from '../../components/ui/ProgressBar'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdArrowBack, MdArrowForward, MdCheck, MdTimer } from 'react-icons/md'

export default function ExamTakingPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({}) // { question_id: selected_answer }
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const timerRef = useRef(null)
  const autoSubmitRef = useRef(false)

  // Load exam data and start attempt
  useEffect(() => {
    if (!user) return
    const init = async () => {
      try {
        const [e, qs, att] = await Promise.all([
          getExamById(examId),
          getQuestions(examId),
          startAttempt(user.id, examId),
        ])
        if (!e) {
          toast.error('Exam not found.')
          navigate('/student/exams')
          return
        }
        if (!qs || qs.length === 0) {
          toast.error('This exam has no questions available.')
          navigate('/student/exams')
          return
        }
        // If already submitted, redirect to result
        if (att && (att.status === 'Submitted' || att.status === 'Timeout')) {
          navigate(`/student/exam/${examId}/result`, { replace: true })
          return
        }
        setExam(e)
        setQuestions(qs)
        setAttempt(att)
        setTimeLeft((e.duration || 60) * 60)
        setLoading(false)
      } catch (err) {
        console.error('Failed to start exam:', err)
        toast.error('Failed to start exam. Please try again.')
        navigate('/student/exams')
      }
    }
    init()

    // Cleanup timer on unmount
    return () => clearInterval(timerRef.current)
  }, [examId, user])

  // Countdown timer
  useEffect(() => {
    if (!attempt || timeLeft <= 0 || submitted) return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          if (!autoSubmitRef.current) {
            autoSubmitRef.current = true
            handleAutoSubmit()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [attempt, submitted])

  const handleAutoSubmit = async () => {
    if (submitting || submitted) return
    toast('⏰ Time expired! Submitting automatically...', { icon: '⏰' })
    await doSubmit('Timeout')
  }

  const doSubmit = useCallback(async (status = 'Submitted') => {
    if (!attempt || submitting) return
    setSubmitting(true)
    clearInterval(timerRef.current)
    try {
      await submitExam(attempt.attempt_id, examId, user.id, status)
      setSubmitted(true)
      toast.success('Exam submitted! Calculating your result...')
      setTimeout(() => navigate(`/student/exam/${examId}/result`, { replace: true }), 1500)
    } catch (err) {
      toast.error('Submission failed. Please try again.')
      setSubmitting(false)
    }
  }, [attempt, examId, user, submitting])

  const handleSelectAnswer = async (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    // Persist to DB asynchronously
    if (attempt) {
      saveAnswer(attempt.attempt_id, questionId, answer).catch(() => {})
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm">Loading examination...</p>
    </div>
  )

  const currentQ = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const timerCritical = timeLeft < 60

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Exam Header */}
      <div className={`sticky top-0 z-20 ${timerCritical ? 'bg-red-600' : 'bg-sidebar'} text-white px-6 py-4 shadow-lg transition-colors duration-300`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-bold truncate">{exam?.exam_title}</p>
            <p className="text-xs opacity-70 mt-0.5">Q {currentIndex + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Progress */}
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="opacity-70">Answered:</span>
              <span className="font-bold">{answeredCount}/{questions.length}</span>
            </div>
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${timerCritical ? 'bg-white/20 animate-pulse' : 'bg-white/10'}`}>
              <MdTimer className="text-lg" />
              <span className={`font-mono font-bold text-lg ${timerCritical ? 'text-red-100' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-5xl mx-auto mt-3">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 grid lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 animate-fade-in">
            {/* Question number & type */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                {currentIndex + 1}
              </div>
              <div>
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">{currentQ.question_type}</span>
                <p className="text-xs text-gray-400">{currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Question text */}
            <p className="text-lg font-semibold text-gray-900 mb-8 leading-relaxed">{currentQ.question_text}</p>

            {/* Answer options */}
            <div className="space-y-3">
              {currentQ.question_type === 'MCQ' && (
                ['A','B','C','D'].map(opt => {
                  const val = currentQ[`option_${opt.toLowerCase()}`]
                  if (!val) return null
                  const selected = answers[currentQ.question_id] === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(currentQ.question_id, opt)}
                      className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                        selected
                          ? 'border-primary-500 bg-primary-50 text-primary-800'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                        selected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>{opt}</span>
                      <span className="font-medium">{val}</span>
                      {selected && <MdCheck className="ml-auto text-primary-600 text-xl" />}
                    </button>
                  )
                })
              )}

              {currentQ.question_type === 'True-False' && (
                ['True','False'].map(opt => {
                  const selected = answers[currentQ.question_id] === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectAnswer(currentQ.question_id, opt)}
                      className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                        selected ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${selected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {opt === 'True' ? 'T' : 'F'}
                      </span>
                      <span className="font-medium">{opt}</span>
                      {selected && <MdCheck className="ml-auto text-primary-600 text-xl" />}
                    </button>
                  )
                })
              )}

              {currentQ.question_type === 'Fill-in-Blank' && (
                <input
                  type="text"
                  value={answers[currentQ.question_id] || ''}
                  onChange={e => handleSelectAnswer(currentQ.question_id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              )}

              {currentQ.question_type === 'Short Answer' && (
                <textarea
                  value={answers[currentQ.question_id] || ''}
                  onChange={e => handleSelectAnswer(currentQ.question_id, e.target.value)}
                  placeholder="Write your answer here..."
                  rows={5}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              icon={<MdArrowBack />}
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-400">{currentIndex + 1} / {questions.length}</span>
            {currentIndex < questions.length - 1 ? (
              <Button
                variant="primary"
                icon={<MdArrowForward />}
                onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<MdCheck />}
                onClick={() => setShowConfirm(true)}
              >
                Submit Exam
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 h-fit lg:sticky lg:top-28">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Question Navigator</p>
          <div className="grid grid-cols-5 gap-2 mb-5">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.question_id]
              const isCurrent = i === currentIndex
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all duration-150 ${
                    isCurrent
                      ? 'bg-primary-600 text-white ring-2 ring-primary-300'
                      : isAnswered
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-primary-600 flex-shrink-0" /> Current</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-100 flex-shrink-0" /> Answered ({answeredCount})</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 flex-shrink-0" /> Not Answered ({questions.length - answeredCount})</div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <Button
              variant="primary"
              className="w-full justify-center"
              onClick={() => setShowConfirm(true)}
              loading={submitting}
            >
              Submit Exam
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Submit Examination"
        size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setShowConfirm(false)}>Review Answers</Button>
          <Button variant="primary" loading={submitting} onClick={() => { setShowConfirm(false); doSubmit() }}>
            Yes, Submit
          </Button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Are you sure you want to submit this exam?
          </p>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Answered</span>
              <span className="font-semibold text-green-600">{answeredCount} / {questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Unanswered</span>
              <span className={`font-semibold ${questions.length - answeredCount > 0 ? 'text-red-500' : 'text-gray-700'}`}>
                {questions.length - answeredCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time Remaining</span>
              <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>
          {questions.length - answeredCount > 0 && (
            <p className="text-xs text-red-500">⚠️ You have {questions.length - answeredCount} unanswered question{questions.length - answeredCount !== 1 ? 's' : ''}.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
