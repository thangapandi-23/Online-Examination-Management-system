import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getStudents } from '../../services/studentService'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { formatDateTime } from '../../utils/formatters'

export default function TeacherAttendancePage() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('exam_attempts').select('*, users!student_id(full_name,email), exams(exam_title)').order('started_at', { ascending: false }).then(r => r.data || []).catch(() => []),
      getStudents().catch(() => []),
    ]).then(([dbAttempts, students]) => {
      const studentMap = new Map()
      students.forEach(s => {
        if (s.id) studentMap.set(s.id, s)
        if (s.student_id) studentMap.set(s.student_id, s)
      })

      const localAttempts = JSON.parse(localStorage.getItem('oems_attempts') || '[]')
      const merged = [...dbAttempts]
      localAttempts.forEach(la => {
        if (!merged.some(a => a.attempt_id === la.attempt_id || (a.student_id === la.student_id && a.exam_id === la.exam_id))) {
          merged.push(la)
        }
      })

      const enriched = merged.map(a => {
        let users = a.users
        if (!users?.full_name) {
          const s = studentMap.get(a.student_id)
          if (s) users = { full_name: s.full_name || s.name }
        }
        return { ...a, users }
      })

      setAttempts(enriched)
      setLoading(false)
    })
  }, [])

  const columns = [
    { label: 'Student', render: r => <span className="font-medium text-gray-800">{r.users?.full_name || r.student_name || 'Student'}</span> },
    { label: 'Exam', render: r => r.exams?.exam_title || '—' },
    { label: 'Started At', render: r => formatDateTime(r.started_at) },
    { label: 'Submitted At', render: r => r.submitted_at ? formatDateTime(r.submitted_at) : '—' },
    { label: 'Status', render: r => <Badge label={r.status} /> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Exam Participation</h1>
        <p className="text-gray-500 text-sm mt-1">{attempts.length} exam sessions recorded</p>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={attempts} emptyMessage="No exam sessions yet." />}
    </div>
  )
}
