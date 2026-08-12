import { useEffect, useState } from 'react'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md'
import { getCourses, upsertCourse, deleteCourse, getDepartments } from '../../services/studentService'

export default function CoursesPage() {
  const [items, setItems] = useState([])
  const [depts, setDepts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ course_name: '', department_id: '', semester: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [courses, departments] = await Promise.all([
        getCourses().catch(() => []),
        getDepartments().catch(() => []),
      ])
      setItems(courses || []); setDepts(departments || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const openModal = (item = null) => {
    setSelected(item)
    setForm(item ? { course_name: item.course_name, department_id: item.department_id || '', semester: item.semester || '' } : { course_name: '', department_id: '', semester: '' })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.course_name) return toast.error('Course name required.')
    setSaving(true)
    try {
      await upsertCourse(selected ? { course_id: selected.course_id, ...form, semester: form.semester ? parseInt(form.semester) : null } : { ...form, semester: form.semester ? parseInt(form.semester) : null })
      toast.success(selected ? 'Course updated!' : 'Course added!')
      setModal(null); setSelected(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteCourse(selected.course_id)
      toast.success('Course deleted.'); setModal(null); setSelected(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { label: 'Course Name', key: 'course_name', sortable: true },
    { label: 'Department', render: r => r.departments?.department_name || r.department_name || depts.find(d => d.department_id === r.department_id || d.department_name === r.department_id)?.department_name || '—' },
    { label: 'Semester', key: 'semester' },
    { label: 'Actions', render: r => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<MdEdit />} onClick={() => openModal(r)} />
        <Button variant="danger" size="sm" icon={<MdDelete />} onClick={() => { setSelected(r); setModal('delete') }} />
      </div>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Courses</h1><p className="text-gray-500 text-sm mt-1">{items.length} courses</p></div>
        <Button variant="primary" icon={<MdAdd />} onClick={() => openModal()}>Add Course</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={items} emptyMessage="No courses yet." />}

      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={selected ? 'Edit Course' : 'Add Course'} size="sm"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Course Name" value={form.course_name} onChange={e => setForm(p => ({...p, course_name: e.target.value}))} required />
          <Select label="Department" value={form.department_id} onChange={e => setForm(p => ({...p, department_id: e.target.value}))} placeholder="Select department" options={depts.map(d => ({ value: d.department_id, label: d.department_name }))} />
          <Input label="Semester" type="number" value={form.semester} onChange={e => setForm(p => ({...p, semester: e.target.value}))} />
        </div>
      </Modal>
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Course" size="sm"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-gray-600">Delete <strong>{selected?.course_name}</strong>?</p>
      </Modal>
    </div>
  )
}
