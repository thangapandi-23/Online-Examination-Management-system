import { useEffect, useState } from 'react'
import { StatCard } from '../../components/ui/Card'
import { supabase } from '../../lib/supabaseClient'
import { getStudents, getTeachers } from '../../services/studentService'
import { getExams } from '../../services/examService'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { formatDateTime } from '../../utils/formatters'
import Spinner from '../../components/ui/Spinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, exams: 0, active: 0 })
  const [recentExams, setRecentExams] = useState([])
  const [gradeData, setGradeData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          studentsList,
          teachersList,
          examsList,
          resResults,
        ] = await Promise.all([
          getStudents().catch(() => []),
          getTeachers().catch(() => []),
          getExams().catch(() => []),
          supabase.from('results').select('grade'),
        ])

        const activeExams = (examsList || []).filter(e => e.status === 'Published').length

        setStats({
          students: (studentsList || []).length,
          teachers: (teachersList || []).length,
          exams: (examsList || []).length,
          active: activeExams,
        })
        setRecentExams((examsList || []).slice(0, 5))

        if (resResults?.data) {
          const counts = {}
          for (const r of resResults.data) {
            counts[r.grade] = (counts[r.grade] || 0) + 1
          }
          const labels = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F']
          setGradeData({
            labels,
            datasets: [{
              label: 'Students',
              data: labels.map(g => counts[g] || 0),
              backgroundColor: [
                '#22c55e','#4ade80','#86efac','#bbf7d0',
                '#fbbf24','#f97316','#ef4444'
              ],
              borderRadius: 8,
            }]
          })
        }
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's an overview of your system.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard icon="👨‍🎓" title="Total Students" value={stats.students} color="blue" subtitle="Registered students" />
        <StatCard icon="👨‍🏫" title="Total Teachers" value={stats.teachers} color="purple" subtitle="Active teachers" />
        <StatCard icon="📋" title="Total Exams" value={stats.exams} color="green" subtitle="All examinations" />
        <StatCard icon="🟢" title="Active Exams" value={stats.active} color="orange" subtitle="Currently published" />
      </div>

      {/* Charts + Recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <h2 className="section-title mb-4">Grade Distribution</h2>
          {gradeData ? (
            <Bar
              data={gradeData}
              options={{
                responsive: true,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw} students` } } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No results yet.</div>
          )}
        </div>

        {/* Role breakdown */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <h2 className="section-title mb-4">User Roles</h2>
          {stats.students + stats.teachers > 0 ? (
            <Doughnut
              data={{
                labels: ['Students', 'Teachers'],
                datasets: [{
                  data: [stats.students, stats.teachers],
                  backgroundColor: ['#4CAF50', '#3b82f6'],
                  borderWidth: 0,
                }]
              }}
              options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No users yet.</div>
          )}
        </div>
      </div>

      {/* Recent Exams */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
        <h2 className="section-title mb-4">Recent Examinations</h2>
        {recentExams.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No examinations yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentExams.map((exam, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{exam.exam_title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(exam.created_at)}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  exam.status === 'Published' ? 'bg-green-100 text-green-700'
                  : exam.status === 'Closed'   ? 'bg-gray-100 text-gray-500'
                  : 'bg-yellow-100 text-yellow-700'
                }`}>{exam.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
