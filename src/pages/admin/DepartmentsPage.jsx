import { useEffect, useState } from 'react'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md'
import { getDepartments, upsertDepartment, deleteDepartment } from '../../services/studentService'
import { formatDate } from '../../utils/formatters'

export default function DepartmentsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      setItems(await getDepartments() || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Department name required.')
    setSaving(true)
    try {
      await upsertDepartment(selected ? { department_id: selected.department_id, department_name: name } : { department_name: name })
      toast.success(selected ? 'Updated!' : 'Department added!')
      setModal(null); setSelected(null); setName(''); load()
    } catch (err) {
      toast.error(err.message || 'Failed to save department.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteDepartment(selected.department_id)
      toast.success('Deleted.'); setModal(null); setSelected(null); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { label: 'Department Name', key: 'department_name', sortable: true },
    { label: 'Created', render: r => formatDate(r.created_at) },
    { label: 'Actions', render: r => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<MdEdit />} onClick={() => { setSelected(r); setName(r.department_name); setModal('edit') }} />
        <Button variant="danger" size="sm" icon={<MdDelete />} onClick={() => { setSelected(r); setModal('delete') }} />
      </div>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Departments</h1><p className="text-gray-500 text-sm mt-1">{items.length} departments</p></div>
        <Button variant="primary" icon={<MdAdd />} onClick={() => { setName(''); setSelected(null); setModal('edit') }}>Add Department</Button>
      </div>
      {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        : <Table columns={columns} data={items} emptyMessage="No departments yet." />}
      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={selected ? 'Edit Department' : 'Add Department'} size="sm"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Save</Button></>}>
        <Input label="Department Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Computer Science" />
      </Modal>
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Department" size="sm"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-gray-600">Delete <strong>{selected?.department_name}</strong>? This may affect related courses and subjects.</p>
      </Modal>
    </div>
  )
}
