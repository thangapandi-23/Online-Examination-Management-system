import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStudentById } from '../../services/studentService'
import { updateUser } from '../../services/studentService'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function StudentProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [studentData, setStudentData] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' })
      getStudentById(profile.id).then(s => { setStudentData(s); setLoading(false) }).catch(() => setLoading(false))
    }
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-lg space-y-6 animate-fade-in">
      <h1 className="page-title">My Profile</h1>
      <Card>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-2xl">
            {(profile?.full_name || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{profile?.full_name}</p>
            <p className="text-gray-500 text-sm">Student</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="space-y-4 mb-6">
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} />
          <Input label="Email" value={profile?.email || ''} disabled helperText="Email cannot be changed." />
          <Input label="Phone" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
        </div>

        {/* Academic info (read-only) */}
        {studentData && (
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-3">Academic Information</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Register No.', value: studentData.register_number },
                { label: 'Semester', value: studentData.semester },
                { label: 'Section', value: studentData.section },
                { label: 'Admission Year', value: studentData.admission_year },
                { label: 'Course', value: studentData.courses?.course_name },
              ].filter(f => f.value).map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="font-medium text-gray-700">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
      </Card>
    </div>
  )
}
