import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getExamById, updateExam } from '../../services/examService'
import { getCourses } from '../../services/studentService'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdArrowBack, MdSave } from 'react-icons/md'

export default function EditExamPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getExamById(examId), getCourses()]).then(([exam, crs]) => {
      setForm({
        exam_title: exam.exam_title || '',
        course_id: exam.course_id || '',
        instructions: exam.instructions || '',
        duration: exam.duration || 60,
        total_marks: exam.total_marks || 100,
        passing_marks: exam.passing_marks || 40,
        negative_marks: exam.negative_marks || false,
        start_time: exam.start_time ? exam.start_time.slice(0, 16) : '',
        end_time: exam.end_time ? exam.end_time.slice(0, 16) : '',
      })
      setCourses(crs || [])
      setLoading(false)
    })
  }, [examId])

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateExam(examId, {
        ...form,
        duration: parseInt(form.duration),
        total_marks: parseInt(form.total_marks),
        passing_marks: parseInt(form.passing_marks),
        start_time: form.start_time ? new Date(form.start_time).toISOString() : null,
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
      })
      toast.success('Exam updated!')
      const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/teacher'
      navigate(`${basePath}/exams`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <MdArrowBack className="text-xl" />
        </button>
        <h1 className="page-title">Edit Examination</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 space-y-6">
        <div className="space-y-4">
          <Input label="Exam Title" value={form.exam_title} onChange={e => set('exam_title', e.target.value)} required />
          <Select label="Course" value={form.course_id} onChange={e => set('course_id', e.target.value)} placeholder="Select course" options={courses.map(c => ({ value: c.course_id, label: c.course_name }))} />
          <div>
            <label className="form-label">Instructions</label>
            <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (min)" type="number" value={form.duration} onChange={e => set('duration', e.target.value)} min={1} />
            <Input label="Total Marks" type="number" value={form.total_marks} onChange={e => set('total_marks', e.target.value)} min={1} />
            <Input label="Passing Marks" type="number" value={form.passing_marks} onChange={e => set('passing_marks', e.target.value)} min={0} />
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" checked={form.negative_marks} onChange={e => set('negative_marks', e.target.checked)} className="w-4 h-4 accent-primary-600" />
              <label className="text-sm font-medium text-gray-700">Negative Marking</label>
            </div>
            <Input label="Start Date & Time" type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} />
            <Input label="End Date & Time" type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" variant="primary" icon={<MdSave />} loading={saving}>Save Changes</Button>
        </div>
      </form>
    </div>
  )
}
