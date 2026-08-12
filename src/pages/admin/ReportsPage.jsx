import { useEffect, useState } from 'react'
import { getAllResults } from '../../services/examService'
import { getExams } from '../../services/examService'
import { Bar, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'
import { StatCard } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { MdDownload } from 'react-icons/md'
import { exportCSV } from '../../utils/formatters'
import Spinner from '../../components/ui/Spinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

export default function ReportsPage() {
  const [results, setResults] = useState([])
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      getAllResults().catch(() => []),
      getExams().catch(() => []),
    ]).then(([r, e]) => {
      if (isMounted) {
        setResults(r || [])
        setExams(e || [])
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) setLoading(false)
    })
    return () => { isMounted = false }
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  // Grade distribution
  const gradeCounts = {}
  const GRADES = ['A+','A','B+','B','C','D','F']
  for (const g of GRADES) gradeCounts[g] = 0
  for (const r of results) gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1

  // Status breakdown
  const passed = results.filter(r => r.status === 'Pass').length
  const failed = results.length - passed
  const avgPct = results.length ? (results.reduce((a, r) => a + parseFloat(r.percentage), 0) / results.length).toFixed(1) : 0

  const gradeChart = {
    labels: GRADES,
    datasets: [{
      label: 'Students',
      data: GRADES.map(g => gradeCounts[g]),
      backgroundColor: ['#22c55e','#4ade80','#86efac','#bbf7d0','#fbbf24','#f97316','#ef4444'],
      borderRadius: 8,
    }]
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Reports & Analytics</h1><p className="text-gray-500 text-sm mt-1">System-wide examination statistics</p></div>
        <Button variant="secondary" icon={<MdDownload />} onClick={() => exportCSV(results.map(r => ({ Student: r.users?.full_name || r.student_name || r.full_name || 'Student', Exam: r.exams?.exam_title || r.exam_title || 'Examination', Grade: r.grade, Score: `${r.obtained_marks}/${r.total_marks}`, Status: r.status })), 'full_report.csv')}>Export Report</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="📊" title="Total Results" value={results.length} color="blue" />
        <StatCard icon="✅" title="Pass Rate" value={results.length ? `${((passed / results.length) * 100).toFixed(0)}%` : '—'} color="green" />
        <StatCard icon="📈" title="Average Score" value={avgPct ? `${avgPct}%` : '—'} color="purple" />
        <StatCard icon="📋" title="Total Exams" value={exams.length} color="orange" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <h2 className="section-title mb-4">Grade Distribution</h2>
          <Bar data={gradeChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <h2 className="section-title mb-4">Pass vs Fail</h2>
          <div className="flex items-center justify-center gap-12 py-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600">{passed}</div>
              <div className="text-sm text-gray-500 mt-2 font-medium">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-red-500">{failed}</div>
              <div className="text-sm text-gray-500 mt-2 font-medium">Failed</div>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mt-4">
            <div className="h-3 bg-green-500 rounded-full" style={{ width: results.length ? `${(passed/results.length)*100}%` : '0%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
