import { supabase } from '../lib/supabaseClient'

// ── Users ──────────────────────────────────────────────────────
export const getUsers = async (role) => {
  let query = supabase.from('users').select('*').order('full_name')
  if (role) query = query.eq('role', role)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const getUserById = async (userId) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export const updateUser = async (userId, updates) => {
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single()
  if (error) throw error
  return data
}

// ── Students ───────────────────────────────────────────────────
// ── Students ───────────────────────────────────────────────────
export const getStudents = async () => {
  let dbStudents = []
  try {
    const [usersRes, studentRes, allUsersRes] = await Promise.all([
      supabase.from('users').select('id,full_name,email,phone,created_at,role').eq('role', 'student').then(r => r).catch(() => ({ data: [] })),
      supabase.from('students').select('student_id,register_number,semester,section,admission_year,course_id,courses(course_name)').then(r => r).catch(() => ({ data: [] })),
      supabase.from('users').select('id,full_name,email,phone,created_at,role').then(r => r).catch(() => ({ data: [] })),
    ])
    const usersData = usersRes?.data?.length ? usersRes.data : (allUsersRes?.data || [])
    const studentData = studentRes?.data || []
    
    const userIds = new Set()
    dbStudents = (usersData || []).map(u => {
      userIds.add(u.id)
      const s = (studentData || []).find(st => st.student_id === u.id) || {}
      return { ...u, ...s }
    })

    ;(studentData || []).forEach(st => {
      if (st.student_id && !userIds.has(st.student_id)) {
        const u = (allUsersRes?.data || []).find(usr => usr.id === st.student_id) || {}
        dbStudents.push({
          id: st.student_id,
          full_name: u.full_name || st.register_number || 'Student',
          email: u.email || '',
          ...u,
          ...st,
        })
      }
    })
  } catch (err) {
    console.error('getStudents error:', err)
  }

  try {
    const localStudents = JSON.parse(localStorage.getItem('oems_students') || '[]')
    const merged = [...dbStudents]
    localStudents.forEach(ls => {
      const idx = merged.findIndex(s => s.id === ls.id || (s.email && s.email.toLowerCase() === (ls.email || '').toLowerCase()))
      if (idx >= 0) {
        merged[idx] = { ...ls, ...merged[idx], full_name: merged[idx].full_name || ls.full_name }
      } else {
        merged.unshift(ls)
      }
    })
    return merged
  } catch {
    return dbStudents
  }
}

export const getStudentById = async (studentId) => {
  const { data, error } = await supabase
    .from('students')
    .select(`*, users ( full_name, email, phone ), courses ( course_name )`)
    .eq('student_id', studentId)
    .single()
  if (error) throw error
  return data
}

export const createStudentAccount = async ({ email, password, full_name, phone, ...studentData }) => {
  // Create auth user with metadata
  const { data: authData, error: authError } = await supabase.auth.admin
    ? await supabase.auth.signUp({
        email, password,
        options: { data: { full_name, role: 'student' } }
      })
    : { data: null, error: new Error('Admin client required') }

  if (authError) throw authError

  const userId = authData.user.id

  // Update users record
  await supabase.from('users').upsert({
    id: userId, email, full_name, phone, role: 'student'
  })

  // Create student record
  const { data, error } = await supabase.from('students').insert({
    student_id: userId,
    ...studentData,
  }).select().single()
  if (error) throw error
  return data
}

export const updateStudentProfile = async (studentId, userUpdates, studentUpdates) => {
  const [userRes, studentRes] = await Promise.all([
    userUpdates ? supabase.from('users').update(userUpdates).eq('id', studentId) : Promise.resolve({}),
    studentUpdates ? supabase.from('students').update(studentUpdates).eq('student_id', studentId) : Promise.resolve({}),
  ])
  if (userRes.error) throw userRes.error
  if (studentRes.error) throw studentRes.error
}

// ── Teachers ───────────────────────────────────────────────────
export const getTeachers = async () => {
  let dbTeachers = []
  try {
    const [usersRes, teacherRes] = await Promise.all([
      supabase.from('users').select('id,full_name,email,phone,created_at').eq('role', 'teacher'),
      supabase.from('teachers').select('teacher_id,employee_id,designation,department_id,departments(department_name)'),
    ])
    const usersData = usersRes?.data || []
    const teacherData = teacherRes?.data || []
    dbTeachers = usersData.map(u => {
      const t = teacherData.find(tr => tr.teacher_id === u.id) || {}
      return { ...u, ...t }
    })
  } catch (err) {
    console.error('getTeachers error:', err)
  }

  try {
    const localTeachers = JSON.parse(localStorage.getItem('oems_teachers') || '[]')
    const merged = [...dbTeachers]
    localTeachers.forEach(lt => {
      if (!merged.some(t => t.id === lt.id || (t.email && t.email.toLowerCase() === (lt.email || '').toLowerCase()))) {
        merged.unshift(lt)
      }
    })
    return merged
  } catch {
    return dbTeachers
  }
}

export const getTeacherById = async (teacherId) => {
  const { data, error } = await supabase
    .from('teachers')
    .select(`*, users ( full_name, email, phone ), departments ( department_name )`)
    .eq('teacher_id', teacherId)
    .single()
  if (error) throw error
  return data
}

// ── Local Storage Fallback Helpers ───────────────────────────
const getLocalItem = (key, defaultVal = []) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : defaultVal
  } catch { return defaultVal }
}

const setLocalItem = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

const INITIAL_DEPTS = [
  { department_id: 'd1', department_name: 'Computer Science & Engineering (CSE)', created_at: new Date().toISOString() },
  { department_id: 'd2', department_name: 'Information Technology (IT)', created_at: new Date().toISOString() },
  { department_id: 'd3', department_name: 'Artificial Intelligence & Data Science (AI & DS)', created_at: new Date().toISOString() },
  { department_id: 'd4', department_name: 'Electronics & Communication Engineering (ECE)', created_at: new Date().toISOString() },
  { department_id: 'd5', department_name: 'Electrical & Electronics Engineering (EEE)', created_at: new Date().toISOString() },
  { department_id: 'd6', department_name: 'Mechanical Engineering (MECH)', created_at: new Date().toISOString() },
  { department_id: 'd7', department_name: 'Civil Engineering (CIVIL)', created_at: new Date().toISOString() },
]

// ── Departments ────────────────────────────────────────────────
export const getDepartments = async () => {
  try {
    const { data, error } = await supabase.from('departments').select('*').order('department_name')
    if (!error && data && data.length > 0) {
      setLocalItem('oems_departments', data)
      return data
    }
  } catch (err) {
    console.warn('Supabase fetch departments error, using local fallback:', err)
  }
  return getLocalItem('oems_departments', INITIAL_DEPTS)
}

export const upsertDepartment = async (dept) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .upsert(dept, { onConflict: 'department_id' })
      .select().single()
    if (!error && data) return data
  } catch (err) {
    console.warn('Supabase upsert department error, using local storage:', err)
  }

  const current = getLocalItem('oems_departments', INITIAL_DEPTS)
  let updatedItem
  if (dept.department_id) {
    updatedItem = { ...dept, created_at: new Date().toISOString() }
    const next = current.map(d => d.department_id === dept.department_id ? updatedItem : d)
    setLocalItem('oems_departments', next)
  } else {
    updatedItem = {
      department_id: `dept_${Date.now()}`,
      department_name: dept.department_name,
      created_at: new Date().toISOString()
    }
    setLocalItem('oems_departments', [updatedItem, ...current])
  }
  return updatedItem
}

export const deleteDepartment = async (id) => {
  try {
    const { error } = await supabase.from('departments').delete().eq('department_id', id)
    if (!error) return
  } catch (err) {
    console.warn('Supabase delete department error, using local storage:', err)
  }
  const current = getLocalItem('oems_departments', INITIAL_DEPTS)
  setLocalItem('oems_departments', current.filter(d => d.department_id !== id))
}

// ── Courses ────────────────────────────────────────────────────
export const getCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, departments ( department_name )')
      .order('course_name')
    if (!error && data && data.length > 0) {
      setLocalItem('oems_courses', data)
      return data
    }
  } catch (err) {
    console.warn('Supabase fetch courses error, using local fallback:', err)
  }
  return getLocalItem('oems_courses', [])
}

export const upsertCourse = async (course) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .upsert(course, { onConflict: 'course_id' })
      .select().single()
    if (!error && data) return data
  } catch (err) {
    console.warn('Supabase upsert course error, using local storage:', err)
  }

  const current = getLocalItem('oems_courses', [])
  let updatedItem
  if (course.course_id) {
    updatedItem = { ...course, created_at: new Date().toISOString() }
    const next = current.map(c => c.course_id === course.course_id ? updatedItem : c)
    setLocalItem('oems_courses', next)
  } else {
    updatedItem = {
      course_id: `course_${Date.now()}`,
      course_name: course.course_name,
      department_id: course.department_id || null,
      semester: course.semester || null,
      created_at: new Date().toISOString()
    }
    setLocalItem('oems_courses', [updatedItem, ...current])
  }
  return updatedItem
}

export const deleteCourse = async (id) => {
  try {
    const { error } = await supabase.from('courses').delete().eq('course_id', id)
    if (!error) return
  } catch (err) {
    console.warn('Supabase delete course error, using local storage:', err)
  }
  const current = getLocalItem('oems_courses', [])
  setLocalItem('oems_courses', current.filter(c => c.course_id !== id))
}

// ── Subjects ───────────────────────────────────────────────────
export const getSubjects = async () => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*, courses ( course_name ), users ( full_name )')
    .order('subject_name')
  if (error) throw error
  return data
}

export const upsertSubject = async (subject) => {
  const { data, error } = await supabase
    .from('subjects')
    .upsert(subject, { onConflict: 'subject_id' })
    .select().single()
  if (error) throw error
  return data
}

export const deleteSubject = async (id) => {
  const { error } = await supabase.from('subjects').delete().eq('subject_id', id)
  if (error) throw error
}

// ── Attendance ─────────────────────────────────────────────────
export const getAttendance = async (filters = {}) => {
  let query = supabase
    .from('attendance')
    .select('*, users ( full_name ), subjects ( subject_name )')
  if (filters.student_id) query = query.eq('student_id', filters.student_id)
  if (filters.subject_id) query = query.eq('subject_id', filters.subject_id)
  const { data, error } = await query
  if (error) throw error
  return data
}

export const upsertAttendance = async (record) => {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(record, { onConflict: 'student_id,subject_id' })
    .select().single()
  if (error) throw error
  return data
}
