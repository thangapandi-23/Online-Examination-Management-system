import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getExams } from '../../services/examService'
import { getAllResults } from '../../services/examService'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { MdDownload } from 'react-icons/md'
import { exportCSV, formatDateTime } from '../../utils/formatters'
import { gradeColor } from '../../utils/gradeCalculator'

export default function TeacherResultsPage() {
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [results, setResults] = useState([])
  const [selectedExam, setSelectedExam] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) getExams({ created_by: user.id }).then(e => setExams(e || [])).catch(() => setExams([]))
  }, [user])

  useEffect(() => {
    if (!selectedExam) { setResults([]); setLoading(false); return }
    setLoading(true)
    getAllResults({ exam_id: selectedExam }).then(r => { setResults(r || []) }).catch(() => setResults([])).finally(() => setLoading(false))
  }, [selectedExam])

  const columns = [
    { label: 'Student', render: r => <span className="font-medium text-gray-800">{r.users?.full_name || r.student_name || r.full_name || 'Student'}</span> },
    { label: 'Score', render: r => `${r.obtained_marks} / ${r.total_marks}` },
    { label: 'Percentage', render: r => `${r.percentage}%` },
    { label: 'Grade', render: r => <span className={`font-bold text-lg ${gradeColor(r.grade)}`}>{r.grade}</span> },
    { label: 'Status', render: r => <Badge label={r.status} /> },
    { label: 'Date', render: r => formatDateTime(r.published_at) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Exam Results</h1><p className="text-gray-500 text-sm mt-1">View student results by exam</p></div>
        {results.length > 0 && (
          <Button variant="secondary" icon={<MdDownload />} onClick={() => exportCSV(
            results.map(r => ({ Student: r.users?.full_name || r.student_name || r.full_name || 'Student', Score: `${r.obtained_marks}/${r.total_marks}`, Percentage: `${r.percentage}%`, Grade: r.grade, Status: r.status })),
            'results.csv'
          )}>Export CSV</Button>
        )}
      </div>
      <Select
        label="Select Exam"
        value={selectedExam}
        onChange={e => setSelectedExam(e.target.value)}
        placeholder="Choose an exam to view results..."
        options={exams.map(e => ({ value: e.exam_id, label: e.exam_title }))}
        className="max-w-sm"
      />
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : selectedExam && <Table columns={columns} data={results} emptyMessage="No results for this exam yet." />}
      {!selectedExam && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center text-gray-400 text-sm">
          Select an exam above to view student results.
        </div>
      )}
    </div>
  )
}
