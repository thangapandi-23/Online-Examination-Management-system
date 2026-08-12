import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAttendance } from '../../services/studentService'
import ProgressBar from '../../components/ui/ProgressBar'
import Spinner from '../../components/ui/Spinner'

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) getAttendance({ student_id: user.id }).then(r => { setRecords(r || []); setLoading(false) })
  }, [user])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">My Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Subject-wise attendance overview</p>
      </div>
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-4">📅</p>
          <p className="text-gray-500 font-medium">No attendance records yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 divide-y divide-gray-50">
          {records.map(r => (
            <div key={r.attendance_id} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-800">{r.subjects?.subject_name || 'Unknown Subject'}</p>
                <span className={`text-xl font-bold ${r.attendance_percentage >= 75 ? 'text-green-600' : r.attendance_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {r.attendance_percentage}%
                </span>
              </div>
              <ProgressBar
                value={r.attendance_percentage}
                max={100}
                color={r.attendance_percentage >= 75 ? 'green' : r.attendance_percentage >= 50 ? 'yellow' : 'red'}
                size="md"
              />
              {r.attendance_percentage < 75 && (
                <p className="text-xs text-red-500 mt-2">⚠️ Below required 75% attendance threshold.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
