import { useEffect, useState } from 'react'
import { supabase, createSecondaryAuthClient } from '../../lib/supabaseClient'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import SearchBar from '../../components/ui/SearchBar'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md'
import { getDepartments } from '../../services/studentService'

const EMPTY = { full_name: '', email: '', phone: '', password: '', employee_id: '', designation: '', department_id: '' }

const STANDARD_DEPARTMENTS = [
  'Computer Science & Engineering (CSE)',
  'Information Technology (IT)',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Electronics & Communication Engineering (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering (MECH)',
  'Civil Engineering (CIVIL)',
]

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      let depts = await getDepartments().catch(() => [])
      if (!depts || depts.length === 0) {
        const { data: seeded } = await supabase
          .from('departments')
          .insert(STANDARD_DEPARTMENTS.map(name => ({ department_name: name })))
          .select()
        if (seeded && seeded.length > 0) depts = seeded
      }

      const [usersRes, teacherRes] = await Promise.all([
        supabase.from('users').select('id,full_name,email,phone,created_at').eq('role', 'teacher'),
        supabase.from('teachers').select('teacher_id,employee_id,designation,department_id,departments(department_name)'),
      ])
      const usersData = usersRes?.data || []
      const teacherData = teacherRes?.data || []
      const merged = usersData.map(u => {
        const t = teacherData.find(t => t.teacher_id === u.id) || {}
        return { ...u, ...t }
      })

      const localTeachers = JSON.parse(localStorage.getItem('oems_teachers') || '[]')
      const allTeachers = [...merged]
      localTeachers.forEach(lt => {
        if (!allTeachers.some(t => t.id === lt.id || (t.email && t.email.toLowerCase() === (lt.email || '').toLowerCase()))) {
          allTeachers.unshift(lt)
        }
      })

      setTeachers(allTeachers)
      setDepartments(depts || [])
    } catch (err) {
      console.error('Teachers load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = teachers.filter(t =>
    (t.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.employee_id || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (t) => {
    setSelected(t)
    setForm({
      full_name: t.full_name || '', email: t.email || '', phone: t.phone || '',
      password: '', employee_id: t.employee_id || '', designation: t.designation || '',
      department_id: t.department_id || '',
    })
    setModal('edit')
  }
  const openDelete = (t) => { setSelected(t); setModal('delete') }
  const close = () => { setModal(null); setSelected(null) }

  const handleSave = async () => {
    if (!form.full_name || !form.email) return toast.error('Name and email required.')
    setSaving(true)
    try {
      let uid = selected?.id
      if (modal === 'add') {
        if (!form.password) { toast.error('Password required.'); setSaving(false); return }
        try {
          const secondaryAuth = createSecondaryAuthClient()
          const { data: authData } = await secondaryAuth.auth.signUp({
            email: form.email, password: form.password,
            options: { data: { full_name: form.full_name, role: 'teacher' } }
          })
          if (authData?.user) uid = authData.user.id
        } catch (e) {
          console.warn('Teacher signup fallback:', e)
        }

        if (!uid) uid = `tc_${Date.now()}`

        try {
          await supabase.from('users').upsert({ id: uid, email: form.email, full_name: form.full_name, phone: form.phone, role: 'teacher' })
        } catch {}
        try {
          await supabase.from('teachers').upsert({ teacher_id: uid, employee_id: form.employee_id || null, designation: form.designation || null, department_id: form.department_id || null })
        } catch {}

        const newTeacher = {
          id: uid,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          employee_id: form.employee_id,
          designation: form.designation,
          department_id: form.department_id,
          created_at: new Date().toISOString()
        }
        const localTeachers = JSON.parse(localStorage.getItem('oems_teachers') || '[]')
        localStorage.setItem('oems_teachers', JSON.stringify([newTeacher, ...localTeachers]))
        toast.success('Teacher added!')
      } else {
        try {
          await supabase.from('users').update({ full_name: form.full_name, phone: form.phone }).eq('id', selected.id)
        } catch {}
        try {
          await supabase.from('teachers').upsert({ teacher_id: selected.id, employee_id: form.employee_id || null, designation: form.designation || null, department_id: form.department_id || null })
        } catch {}

        const localTeachers = JSON.parse(localStorage.getItem('oems_teachers') || '[]')
        const updatedLocal = localTeachers.map(t => t.id === selected.id ? { ...t, ...form } : t)
        localStorage.setItem('oems_teachers', JSON.stringify(updatedLocal))
        toast.success('Teacher updated!')
      }
      close(); load()
    } catch (err) { toast.error(err.message || 'Failed to save teacher.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    try {
      try {
        await supabase.from('teachers').delete().eq('teacher_id', selected.id)
      } catch {}
      try {
        await supabase.from('users').delete().eq('id', selected.id)
      } catch {}

      const localTeachers = JSON.parse(localStorage.getItem('oems_teachers') || '[]')
      const filtered = localTeachers.filter(t => t.id !== selected.id && t.email?.toLowerCase() !== selected.email?.toLowerCase())
      localStorage.setItem('oems_teachers', JSON.stringify(filtered))

      toast.success('Teacher removed successfully.')
      close()
      load()
    } catch (err) {
      console.error('Delete teacher error:', err)
      toast.error(err.message || 'Failed to remove teacher.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { label: 'Name', key: 'full_name', sortable: true, render: r => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
          {(r.full_name || '?')[0].toUpperCase()}
        </div>
        <span className="font-medium text-gray-800">{r.full_name}</span>
      </div>
    )},
    { label: 'Email', key: 'email' },
    { label: 'Employee ID', key: 'employee_id' },
    { label: 'Designation', key: 'designation' },
    { label: 'Department', render: r => r.departments?.department_name || r.department_name || departments.find(d => d.department_id === r.department_id || d.department_name === r.department_id)?.department_name || r.department_id || '—' },
    { label: 'Actions', render: r => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<MdEdit />} onClick={() => openEdit(r)} />
        <Button variant="danger" size="sm" icon={<MdDelete />} onClick={() => openDelete(r)} />
      </div>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Teachers</h1>
          <p className="text-gray-500 text-sm mt-1">{teachers.length} teachers registered</p>
        </div>
        <Button variant="primary" icon={<MdAdd />} onClick={openAdd}>Add Teacher</Button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search teachers..." className="max-w-sm" />
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={filtered} emptyMessage="No teachers found." />}

      <Modal isOpen={modal === 'add' || modal === 'edit'} onClose={close} title={modal === 'add' ? 'Add Teacher' : 'Edit Teacher'} size="lg"
        footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>{modal === 'add' ? 'Add' : 'Save'}</Button></>}>
        <form autoComplete="off" onSubmit={e => e.preventDefault()} className="grid grid-cols-2 gap-4">
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} required placeholder="Enter Name" autoComplete="off" className="col-span-2" />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} required disabled={modal === 'edit'} placeholder="Enter E-mail ID" autoComplete="off" />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="Enter Phone Number" autoComplete="off" />
          {modal === 'add' && <Input label="Password" type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} required placeholder="Enter Password" autoComplete="new-password" />}
          <Input label="Employee ID" value={form.employee_id} onChange={e => setForm(p => ({...p, employee_id: e.target.value}))} placeholder="Enter Employee ID" autoComplete="off" />
          <Input label="Designation" value={form.designation} onChange={e => setForm(p => ({...p, designation: e.target.value}))} placeholder="Enter Designation" autoComplete="off" />
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
            className="col-span-2"
          />
        </form>
      </Modal>
      <Modal isOpen={modal === 'delete'} onClose={close} title="Remove Teacher" size="sm"
        footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete}>Remove</Button></>}>
        <p className="text-gray-600 text-sm">Remove <strong>{selected?.full_name}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  )
}
