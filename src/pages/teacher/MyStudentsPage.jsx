import { useEffect, useState } from 'react'
import { getStudents } from '../../services/studentService'
import Table from '../../components/ui/Table'
import SearchBar from '../../components/ui/SearchBar'
import Spinner from '../../components/ui/Spinner'

export default function MyStudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getStudents().then(data => {
      setStudents(data || [])
    }).catch(err => {
      console.error('Failed to load students:', err)
      setStudents([])
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const filtered = students.filter(s =>
    (s.full_name || s.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.register_number || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { label: 'Name', render: r => {
      const name = r.full_name || r.name || 'Student'
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
            {(name || '?')[0].toUpperCase()}
          </div>
          <span className="font-medium text-gray-800">{name}</span>
        </div>
      )
    }},
    { label: 'Email', key: 'email', render: r => r.email || '—' },
    { label: 'Reg. No.', key: 'register_number', render: r => r.register_number || '—' },
    { label: 'Course', render: r => r.courses?.course_name || r.course_name || '—' },
    { label: 'Semester', render: r => r.semester || '—' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">My Students</h1><p className="text-gray-500 text-sm mt-1">{students.length} enrolled students</p></div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search students..." className="max-w-sm" />
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={filtered} emptyMessage="No students found." />}
    </div>
  )
}
