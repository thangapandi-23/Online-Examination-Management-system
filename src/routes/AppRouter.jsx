import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Spinner from '../components/ui/Spinner'

// Public pages
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'

// Admin pages
import DashboardLayout from '../layouts/DashboardLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminStudents from '../pages/admin/StudentsPage'
import AdminTeachers from '../pages/admin/TeachersPage'
import AdminDepartments from '../pages/admin/DepartmentsPage'
import AdminCourses from '../pages/admin/CoursesPage'
import AdminExams from '../pages/admin/ExamsPage'
import AdminResults from '../pages/admin/ResultsPage'
import AdminReports from '../pages/admin/ReportsPage'
import AdminSettings from '../pages/admin/SettingsPage'

// Teacher pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import TeacherStudents from '../pages/teacher/MyStudentsPage'
import TeacherExams from '../pages/teacher/ExamsPage'
import CreateExam from '../pages/teacher/CreateExamPage'
import EditExam from '../pages/teacher/EditExamPage'
import QuestionBank from '../pages/teacher/QuestionBankPage'
import TeacherResults from '../pages/teacher/ResultsPage'
import TeacherAttendance from '../pages/teacher/AttendancePage'
import TeacherProfile from '../pages/teacher/ProfilePage'

// Student pages
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentExams from '../pages/student/ExamsPage'
import ExamInstructions from '../pages/student/ExamInstructionsPage'
import ExamTaking from '../pages/student/ExamTakingPage'
import ExamResult from '../pages/student/ResultPage'
import StudentGrades from '../pages/student/GradesPage'
import StudentProfile from '../pages/student/ProfilePage'

function RoleRedirect() {
  const { user, role, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (role === 'admin')   return <Navigate to="/admin/dashboard" replace />
  if (role === 'teacher') return <Navigate to="/teacher/dashboard" replace />
  if (role === 'student') return <Navigate to="/student/dashboard" replace />
  return <Navigate to="/login" replace />
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Auto-redirect based on role */}
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout role="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/departments" element={<AdminDepartments />} />
          <Route path="/admin/courses" element={<AdminCourses />} />
          <Route path="/admin/exams" element={<AdminExams />} />
          <Route path="/admin/exams/create" element={<CreateExam />} />
          <Route path="/admin/exams/:examId/edit" element={<EditExam />} />
          <Route path="/admin/exams/:examId/questions" element={<QuestionBank />} />
          <Route path="/admin/results" element={<AdminResults />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route element={<DashboardLayout role="teacher" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/profile" element={<TeacherProfile />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/exams" element={<TeacherExams />} />
          <Route path="/teacher/exams/create" element={<CreateExam />} />
          <Route path="/teacher/exams/:examId/edit" element={<EditExam />} />
          <Route path="/teacher/exams/:examId/questions" element={<QuestionBank />} />
          <Route path="/teacher/results" element={<TeacherResults />} />
          <Route path="/teacher/attendance" element={<TeacherAttendance />} />
        </Route>
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/student/grades" element={<StudentGrades />} />
        </Route>
        {/* Exam taking is fullscreen — no sidebar layout */}
        <Route path="/student/exam/:examId/instructions" element={<ExamInstructions />} />
        <Route path="/student/exam/:examId/take" element={<ExamTaking />} />
        <Route path="/student/exam/:examId/result" element={<ExamResult />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
