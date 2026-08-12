import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getExams, deleteExam, updateExam } from '../../services/examService'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import SearchBar from '../../components/ui/SearchBar'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { MdAdd, MdEdit, MdDelete, MdQuiz, MdLockOpen, MdLock } from 'react-icons/md'
import { formatDateTime, formatDuration } from '../../utils/formatters'

export default function TeacherExamsPage() {
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      if (user) {
        const data = await getExams({ created_by: user.id })
        setExams(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [user])

  const filtered = exams.filter(e =>
    (e.exam_title || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleTogglePublish = async (exam) => {
    const newStatus = exam.status === 'Draft' ? 'Published' : exam.status === 'Published' ? 'Closed' : 'Published'
    setSaving(true)
    try {
      await updateExam(exam.exam_id, { status: newStatus })
      toast.success(`Exam ${newStatus}.`)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteExam(selected.exam_id)
      toast.success('Exam deleted.'); setModal(null); setSelected(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { label: 'Exam Title', key: 'exam_title', sortable: true, render: r => <span className="font-medium text-gray-800">{r.exam_title}</span> },
    { label: 'Course', render: r => r.courses?.course_name || '—' },
    { label: 'Duration', render: r => formatDuration(r.duration) },
    { label: 'Total Marks', key: 'total_marks' },
    { label: 'Start Time', render: r => formatDateTime(r.start_time) },
    { label: 'Status', render: r => <Badge label={r.status} /> },
    { label: 'Actions', render: r => (
      <div className="flex items-center gap-2 flex-wrap">
        <Link to={`/teacher/exams/${r.exam_id}/questions`}>
          <Button variant="outline" size="sm" icon={<MdQuiz />}>Questions</Button>
        </Link>
        {r.status === 'Draft' && (
          <Link to={`/teacher/exams/${r.exam_id}/edit`}>
            <Button variant="ghost" size="sm" icon={<MdEdit />} />
          </Link>
        )}
        <Button
          variant={r.status === 'Published' ? 'ghost' : 'secondary'}
          size="sm"
          icon={r.status === 'Published' ? <MdLock /> : <MdLockOpen />}
          onClick={() => handleTogglePublish(r)}
        >
          {r.status === 'Draft' ? 'Publish' : r.status === 'Published' ? 'Close' : 'Reopen'}
        </Button>
        {r.status === 'Draft' && (
          <Button variant="danger" size="sm" icon={<MdDelete />} onClick={() => { setSelected(r); setModal('delete') }} />
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">My Examinations</h1>
          <p className="text-gray-500 text-sm mt-1">{exams.length} exams created</p>
        </div>
        <Link to="/teacher/exams/create">
          <Button variant="primary" icon={<MdAdd />}>Create Exam</Button>
        </Link>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search exams..." className="max-w-sm" />
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={filtered} emptyMessage="No exams yet. Create your first exam!" />}
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Exam" size="sm"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-gray-600">Delete <strong>{selected?.exam_title}</strong>? All questions will be removed.</p>
      </Modal>
    </div>
  )
}
