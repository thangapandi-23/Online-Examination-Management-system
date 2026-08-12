import { useEffect, useState } from 'react'
import { supabase, createSecondaryAuthClient } from '../../lib/supabaseClient'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import SearchBar from '../../components/ui/SearchBar'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete, MdPerson } from 'react-icons/md'
import { getCourses, getDepartments, getStudents } from '../../services/studentService'
import { formatDate } from '../../utils/formatters'

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', password: '',
  register_number: '', semester: '', section: '', admission_year: '',
  department_id: '', course_id: '',
}

const STANDARD_DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CIVIL)',
]

const STANDARD_COURSES = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CIVIL)',
]

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [courseList, deptList, studentList] = await Promise.all([
        getCourses().catch(() => []),
        getDepartments().catch(() => []),
        getStudents().catch(() => []),
      ])

      setStudents(studentList || [])
      setCourses(courseList || [])
      setDepartments(deptList || [])
    } catch (err) {
      console.error('Students load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = students.filter(s =>
    (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.register_number || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(EMPTY_FORM); setModal('add') }
  const openEdit = (s) => {
    setSelected(s)
    setForm({
      full_name: s.full_name || '', email: s.email || '', phone: s.phone || '',
      password: '', register_number: s.register_number || '',
      semester: s.semester || '', section: s.section || '',
      admission_year: s.admission_year || '', department_id: s.department_id || '',
      course_id: s.course_id || '',
    })
    setModal('edit')
  }
  const openDelete = (s) => { setSelected(s); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleSave = async () => {
    if (!form.full_name || !form.email) return toast.error('Name and email are required.')
    setSaving(true)
    try {
      let uid = selected?.id
      if (modal === 'add') {
        if (!form.password) { toast.error('Password is required.'); setSaving(false); return }
        try {
          const secondaryAuth = createSecondaryAuthClient()
          const { data: authData } = await secondaryAuth.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.full_name, role: 'student' } }
          })
          if (authData?.user) uid = authData.user.id
        } catch (e) {
          console.warn('Auth signup fallback:', e)
        }

        if (!uid) uid = `st_${Date.now()}`

        // Upsert users & students tables
        try {
          await supabase.from('users').upsert({ id: uid, email: form.email, full_name: form.full_name, phone: form.phone, role: 'student' })
        } catch {}
        try {
          await supabase.from('students').upsert({
            student_id: uid,
            register_number: form.register_number || null,
            course_id: form.course_id || null,
            semester: form.semester ? parseInt(form.semester) : null,
            section: form.section || null,
            admission_year: form.admission_year ? parseInt(form.admission_year) : null,
          })
        } catch {}

        const newStudent = {
          id: uid,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          register_number: form.register_number,
          department_id: form.department_id,
          course_id: form.course_id,
          semester: form.semester,
          section: form.section,
          admission_year: form.admission_year,
          created_at: new Date().toISOString()
        }
        const localStudents = JSON.parse(localStorage.getItem('oems_students') || '[]')
        localStorage.setItem('oems_students', JSON.stringify([newStudent, ...localStudents]))
        toast.success('Student added successfully!')
      } else {
        try {
          await supabase.from('users').update({
            full_name: form.full_name, phone: form.phone,
          }).eq('id', selected.id)
        } catch {}
        try {
          await supabase.from('students').upsert({
            student_id: selected.id,
            register_number: form.register_number || null,
            course_id: form.course_id || null,
            semester: form.semester ? parseInt(form.semester) : null,
            section: form.section || null,
            admission_year: form.admission_year ? parseInt(form.admission_year) : null,
          })
        } catch {}

        const localStudents = JSON.parse(localStorage.getItem('oems_students') || '[]')
        const updatedLocal = localStudents.map(s => s.id === selected.id ? { ...s, ...form } : s)
        localStorage.setItem('oems_students', JSON.stringify(updatedLocal))
        toast.success('Student updated!')
      }
      closeModal(); load()
    } catch (err) {
      toast.error(err.message || 'Failed to save student.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    try {
      try {
        await supabase.from('students').delete().eq('student_id', selected.id)
      } catch {}
      try {
        await supabase.from('users').delete().eq('id', selected.id)
      } catch {}

      const localStudents = JSON.parse(localStorage.getItem('oems_students') || '[]')
      const filtered = localStudents.filter(s => s.id !== selected.id && s.email?.toLowerCase() !== selected.email?.toLowerCase())
      localStorage.setItem('oems_students', JSON.stringify(filtered))

      toast.success('Student removed successfully.')
      closeModal()
      load()
    } catch (err) {
      console.error('Delete student error:', err)
      toast.error(err.message || 'Failed to remove student.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { label: '#', render: (_, i) => i + 1 },
    { label: 'Name', key: 'full_name', sortable: true, render: r => {
      const name = r.full_name || r.name || 'Student'
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {(name || '?')[0].toUpperCase()}
          </div>
          <span className="font-medium text-gray-800">{name}</span>
        </div>
      )
    }},
    { label: 'Email', key: 'email', sortable: true },
    { label: 'Department', render: r => r.department_name || departments.find(d => d.department_id === r.department_id || d.department_name === r.department_id)?.department_name || r.department_id || '—' },
    { label: 'Course', render: r => r.courses?.course_name || r.course_name || courses.find(c => c.course_id === r.course_id || c.course_name === r.course_id)?.course_name || r.course_id || '—' },
    { label: 'Semester', key: 'semester' },
    { label: 'Joined', render: r => formatDate(r.created_at) },
    { label: 'Actions', render: r => (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" icon={<MdEdit />} onClick={() => openEdit(r)} />
        <Button variant="danger" size="sm" icon={<MdDelete />} onClick={() => openDelete(r)} />
      </div>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} registered students</p>
        </div>
        <Button variant="primary" icon={<MdAdd />} onClick={openAdd}>Add Student</Button>
      </div>

      <div className="flex gap-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or reg. no..." className="flex-1 max-w-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <Table columns={columns} data={filtered} emptyMessage="No students found." />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal === 'add' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'add' ? 'Add New Student' : 'Edit Student'}
        size="lg"
        footer={<>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {modal === 'add' ? 'Add Student' : 'Save Changes'}
          </Button>
        </>}
      >
        <form autoComplete="off" onSubmit={e => e.preventDefault()} className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} required placeholder="Enter Name" autoComplete="off" className="col-span-2" />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required disabled={modal === 'edit'} placeholder="Enter E-mail ID" autoComplete="off" />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="Enter Phone Number" autoComplete="off" />
          {modal === 'add' && (
            <Input label="Password" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required placeholder="Enter Password" autoComplete="new-password" />
          )}
          <Input label="Register Number" value={form.register_number} onChange={e => setForm(p => ({...p, register_number: e.target.value}))} placeholder="Enter Register Number" autoComplete="off" />
          <Select
            label="Department"
            value={form.department_id}
            onChange={e => setForm(p => ({...p, department_id: e.target.value}))}
            placeholder="Select Department"
            options={
              departments.length > 0
                ? departments.map(d => ({ value: d.department_id, label: d.department_name }))
                : STANDARD_DEPARTMENTS.map(d => ({ value: d, label: d }))
            }
          />
          <Select
            label="Course"
            value={form.course_id}
            onChange={e => setForm(p => ({...p, course_id: e.target.value}))}
            placeholder="Select course"
            options={
              courses.length > 0
                ? courses.map(c => ({ value: c.course_id, label: c.course_name }))
                : STANDARD_COURSES.map(c => ({ value: c, label: c }))
            }
          />
          <Input label="Semester" type="number" value={form.semester} onChange={e => setForm(p => ({...p, semester: e.target.value}))} placeholder="Enter Semester" autoComplete="off" />
          <Input label="Section" value={form.section} onChange={e => setForm(p => ({...p, section: e.target.value}))} placeholder="Enter Section" autoComplete="off" />
          <Input label="Admission Year" type="number" value={form.admission_year} onChange={e => setForm(p => ({...p, admission_year: e.target.value}))} placeholder="Enter Admission Year" autoComplete="off" />
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={modal === 'delete'}
        onClose={closeModal}
        title="Remove Student"
        size="sm"
        footer={<>
          <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          <Button variant="danger" loading={saving} onClick={handleDelete}>Remove</Button>
        </>}
      >
        <p className="text-gray-600 text-sm">
          Are you sure you want to remove <strong>{selected?.full_name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
