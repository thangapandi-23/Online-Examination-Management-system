import { useEffect, useState } from 'react'
import { getAllResults } from '../../services/examService'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import SearchBar from '../../components/ui/SearchBar'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { MdDownload } from 'react-icons/md'
import { formatDateTime, exportCSV } from '../../utils/formatters'
import { gradeColor } from '../../utils/gradeCalculator'

export default function ResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let isMounted = true
    getAllResults().then(data => {
      if (isMounted) {
        setResults(data || [])
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [])

  const filtered = results.filter(r =>
    (r.users?.full_name || r.student_name || r.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.exams?.exam_title || r.exam_title || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = () => {
    exportCSV(filtered.map(r => ({
      Student: r.users?.full_name || r.student_name || r.full_name || 'Student',
      Exam: r.exams?.exam_title || r.exam_title || 'Examination',
      Obtained: r.obtained_marks, Total: r.total_marks,
      Percentage: r.percentage + '%', Grade: r.grade, Status: r.status,
    })), 'results.csv')
  }

  const columns = [
    { label: 'Student', render: r => <span className="font-medium text-gray-800">{r.users?.full_name || r.student_name || r.full_name || 'Student'}</span> },
    { label: 'Exam', render: r => r.exams?.exam_title || '—' },
    { label: 'Score', render: r => `${r.obtained_marks} / ${r.total_marks}` },
    { label: 'Percentage', render: r => `${r.percentage}%` },
    { label: 'Grade', render: r => <span className={`font-bold text-lg ${gradeColor(r.grade)}`}>{r.grade}</span> },
    { label: 'Status', render: r => <Badge label={r.status} /> },
    { label: 'Date', render: r => formatDateTime(r.published_at) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="page-title">All Results</h1><p className="text-gray-500 text-sm mt-1">{results.length} results</p></div>
        <Button variant="secondary" icon={<MdDownload />} onClick={handleExport}>Export CSV</Button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by student or exam..." className="max-w-sm" />
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={filtered} emptyMessage="No results yet." />}
    </div>
  )
}
