import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getExams } from '../../services/examService'
import { getStudents } from '../../services/studentService'
import { supabase } from '../../lib/supabaseClient'
import { StatCard } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { formatDateTime, formatDuration } from '../../utils/formatters'
import Spinner from '../../components/ui/Spinner'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { MdAdd } from 'react-icons/md'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [exams, setExams] = useState([])
  const [studentCount, setStudentCount] = useState(0)
  const [resultStats, setResultStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [examList, studentList] = await Promise.all([
          getExams({ created_by: user.id }),
          getStudents().catch(() => []),
        ])
        setExams(examList || [])
        setStudentCount(studentList ? studentList.length : 0)

        const examIds = (examList || []).map(e => e.exam_id)
        if (examIds.length > 0) {
          const { data: results } = await supabase.from('results')
            .select('grade, obtained_marks, total_marks, percentage')
            .in('exam_id', examIds)

          if (results?.length) {
            const avg = (results.reduce((a, r) => a + (r.percentage || 0), 0) / results.length).toFixed(1)
            const counts = {}
            for (const r of results) counts[r.grade] = (counts[r.grade] || 0) + 1
            setResultStats({ avg, counts })
          }
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const published = exams.filter(e => e.status === 'Published').length
  const drafts = exams.filter(e => e.status === 'Draft').length
  const closed = exams.filter(e => e.status === 'Closed').length

  const GRADES = ['A+','A','B+','B','C','D','F']
  const gradeChart = resultStats ? {
    labels: GRADES,
    datasets: [{
      label: 'Students',
      data: GRADES.map(g => resultStats.counts[g] || 0),
      backgroundColor: ['#22c55e','#4ade80','#86efac','#bbf7d0','#fbbf24','#f97316','#ef4444'],
      borderRadius: 8,
    }]
  } : null

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Teacher Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your exams and monitor student performance.</p>
        </div>
        <Link to="/teacher/exams/create">
          <Button variant="primary" icon={<MdAdd />}>Create Exam</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon="📋" title="Total Exams" value={exams.length} color="blue" />
        <StatCard icon="🟢" title="Published" value={published} color="green" />
        <StatCard icon="✏️" title="Drafts" value={drafts} color="orange" />
        <StatCard icon="📈" title="Avg. Score" value={resultStats ? `${resultStats.avg}%` : '—'} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {gradeChart && (
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 p-6">
            <h2 className="section-title mb-4">Grade Distribution (Your Exams)</h2>
            <Bar data={gradeChart} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }} />
          </div>
        )}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <h2 className="section-title mb-4">Quick Stats</h2>
          <div className="space-y-4">
            {[
              { label: 'Published Exams', value: published, color: 'bg-green-100 text-green-700' },
              { label: 'Draft Exams', value: drafts, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Closed Exams', value: closed, color: 'bg-gray-100 text-gray-600' },
              { label: 'Total Students', value: studentCount, color: 'bg-blue-100 text-blue-700' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{s.label}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Exams */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">My Recent Exams</h2>
          <Link to="/teacher/exams" className="text-sm text-primary-600 hover:underline font-medium">View All →</Link>
        </div>
        {exams.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No exams yet. Create your first exam!</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {exams.slice(0, 5).map(e => (
              <div key={e.exam_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{e.exam_title}</p>
                  <p className="text-xs text-gray-400">{formatDuration(e.duration)} • {formatDateTime(e.start_time)}</p>
                </div>
                <Badge label={e.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
