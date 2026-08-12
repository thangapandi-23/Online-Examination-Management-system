import { useEffect, useState } from 'react'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md'
import { getSubjects, upsertSubject, deleteSubject, getCourses, getUsers } from '../../services/studentService'

export default function SubjectsPage() {
  const [items, setItems] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ subject_name: '', subject_code: '', course_id: '', teacher_id: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [subjects, courseList, teacherList] = await Promise.all([
        getSubjects().catch(() => []),
        getCourses().catch(() => []),
        getUsers('teacher').catch(() => []),
      ])
      setItems(subjects || []); setCourses(courseList || []); setTeachers(teacherList || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const openModal = (item = null) => {
    setSelected(item)
    setForm(item ? { subject_name: item.subject_name, subject_code: item.subject_code || '', course_id: item.course_id || '', teacher_id: item.teacher_id || '' } : { subject_name: '', subject_code: '', course_id: '', teacher_id: '' })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.subject_name) return toast.error('Subject name required.')
    setSaving(true)
    try {
      await upsertSubject(selected ? { subject_id: selected.subject_id, ...form } : form)
      toast.success(selected ? 'Subject updated!' : 'Subject added!')
      setModal(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteSubject(selected.subject_id)
      toast.success('Deleted.'); setModal(null); setSelected(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { label: 'Subject', key: 'subject_name', sortable: true },
    { label: 'Code', key: 'subject_code' },
    { label: 'Course', render: r => r.courses?.course_name || '—' },
    { label: 'Teacher', render: r => r.users?.full_name || '—' },
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
        <div><h1 className="page-title">Subjects</h1><p className="text-gray-500 text-sm mt-1">{items.length} subjects</p></div>
        <Button variant="primary" icon={<MdAdd />} onClick={() => openModal()}>Add Subject</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={items} emptyMessage="No subjects yet." />}

      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={selected ? 'Edit Subject' : 'Add Subject'} size="md"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Subject Name" value={form.subject_name} onChange={e => setForm(p => ({...p, subject_name: e.target.value}))} required />
          <Input label="Subject Code" value={form.subject_code} onChange={e => setForm(p => ({...p, subject_code: e.target.value}))} />
          <Select label="Course" value={form.course_id} onChange={e => setForm(p => ({...p, course_id: e.target.value}))} placeholder="Select course" options={courses.map(c => ({ value: c.course_id, label: c.course_name }))} />
          <Select label="Assign Teacher" value={form.teacher_id} onChange={e => setForm(p => ({...p, teacher_id: e.target.value}))} placeholder="Select teacher" options={teachers.map(t => ({ value: t.id, label: t.full_name }))} />
        </div>
      </Modal>
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Subject" size="sm"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-gray-600">Delete <strong>{selected?.subject_name}</strong>?</p>
      </Modal>
    </div>
  )
}
