import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { updateUser } from '../../services/studentService'
import toast from 'react-hot-toast'
import { MdPerson, MdEmail, MdPhone, MdBadge } from 'react-icons/md'

export default function TeacherProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateUser(profile.id, form)
      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <h1 className="page-title">My Profile</h1>
      <Card>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl">
            {(profile?.full_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{profile?.full_name}</p>
            <p className="text-gray-500 text-sm capitalize">{profile?.role}</p>
          </div>
        </div>
        <div className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} icon={<MdPerson />} />
          <Input label="Email" value={profile?.email || ''} disabled icon={<MdEmail />} helperText="Email cannot be changed." />
          <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} icon={<MdPhone />} />
          <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
        </div>
      </Card>
    </div>
  )
}
