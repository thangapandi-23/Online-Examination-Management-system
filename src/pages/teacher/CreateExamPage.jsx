import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { createExam } from '../../services/examService'
import { getCourses } from '../../services/studentService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'
import { MdArrowBack, MdSave } from 'react-icons/md'

export default function CreateExamPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState({
    exam_title: '', course_id: '', instructions: '',
    duration: 60, total_marks: 100, passing_marks: 40,
    start_time: '', end_time: '', negative_marks: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCourses().then(c => setCourses(c || []))
  }, [])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.exam_title) return toast.error('Exam title is required.')
    if (!form.duration || form.duration < 1) return toast.error('Duration must be at least 1 minute.')
    setSaving(true)
    try {
      const exam = await createExam({
        ...form,
        created_by: user.id,
        duration: parseInt(form.duration),
        total_marks: parseInt(form.total_marks),
        passing_marks: parseInt(form.passing_marks),
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        status: 'Draft',
      })
      toast.success('Exam created as Draft!')
      const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/teacher'
      navigate(`${basePath}/exams/${exam.exam_id}/questions`)
    } catch (err) {
      toast.error(err.message || 'Failed to create exam.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <MdArrowBack className="text-xl" />
        </button>
        <div>
          <h1 className="page-title">Create Examination</h1>
          <p className="text-gray-500 text-sm mt-1">Fill in exam details. You can add questions on the next step.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
        <div>
          <h2 className="section-title mb-4">Exam Details</h2>
          <div className="space-y-4">
            <Input
              label="Exam Title"
              value={form.exam_title}
              onChange={e => set('exam_title', e.target.value)}
              placeholder="e.g. Mid-Term Exam"
              required
            />
            <Select
              label="Course"
              value={form.course_id}
              onChange={e => set('course_id', e.target.value)}
              placeholder="Select course (optional)"
              options={courses.map(c => ({ value: c.course_id, label: c.course_name }))}
            />
            <div>
              <label className="form-label">Instructions</label>
              <textarea
                value={form.instructions}
                onChange={e => set('instructions', e.target.value)}
                rows={3}
                placeholder="Exam instructions for students..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h2 className="section-title mb-4">Timing & Marks</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (minutes)" type="number" value={form.duration} onChange={e => set('duration', e.target.value)} min={1} required />
            <Input label="Total Marks" type="number" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} min={1} required />
            <Input label="Passing Marks" type="number" value={form.passing_marks} onChange={e => set('passing_marks', e.target.value)} min={0} required />
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="neg" checked={form.negative_marks} onChange={e => set('negative_marks', e.target.checked)} className="w-4 h-4 accent-primary-600" />
              <label htmlFor="neg" className="text-sm font-medium text-gray-700">Negative Marking</label>
            </div>
            <Input label="Start Date & Time" type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            <Input label="End Date & Time" type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" variant="primary" icon={<MdSave />} loading={saving}>
            Save & Add Questions
          </Button>
        </div>
      </form>
    </div>
  )
}
