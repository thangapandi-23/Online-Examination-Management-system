import { supabase } from '../lib/supabaseClient'
import { evaluateExam } from '../utils/gradeCalculator'
import { getStudents } from './studentService'

// ── Exam CRUD ──────────────────────────────────────────────────
// ── Exam Local Persistence Helpers ─────────────────────────────────────
const saveExamLocal = (exam) => {
  try {
    const key = 'oems_exams'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = existing.findIndex(e => e.exam_id === exam.exam_id)
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...exam }
    } else {
      existing.unshift(exam)
    }
    localStorage.setItem(key, JSON.stringify(existing))
  } catch (err) {
    console.error('saveExamLocal error:', err)
  }
}

const removeExamLocal = (examId) => {
  try {
    const key = 'oems_exams'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const filtered = existing.filter(e => e.exam_id !== examId)
    localStorage.setItem(key, JSON.stringify(filtered))
  } catch (err) {
    console.error('removeExamLocal error:', err)
  }
}

// ── Exam CRUD ──────────────────────────────────────────────────
export const getExams = async (filters = {}) => {
  let dbExams = []
  try {
    let query = supabase.from('exams').select(`
      *,
      courses ( course_name ),
      users ( full_name )
    `).order('created_at', { ascending: false })

    if (filters.status)     query = query.eq('status', filters.status)
    if (filters.created_by) query = query.eq('created_by', filters.created_by)

    const { data, error } = await query
    if (!error && data) {
      dbExams = data
    } else {
      let query2 = supabase.from('exams').select('*').order('created_at', { ascending: false })
      if (filters.status)     query2 = query2.eq('status', filters.status)
      if (filters.created_by) query2 = query2.eq('created_by', filters.created_by)
      const res = await query2
      if (res.data) dbExams = res.data
    }
  } catch (err) {
    console.error('getExams error:', err)
  }

  try {
    const localExams = JSON.parse(localStorage.getItem('oems_exams') || '[]')
    const merged = [...dbExams]

    localExams.forEach(le => {
      if (filters.status && le.status !== filters.status) return
      if (filters.created_by && le.created_by && le.created_by !== filters.created_by) return

      const idx = merged.findIndex(e => e.exam_id === le.exam_id)
      if (idx >= 0) {
        merged[idx] = { ...le, ...merged[idx] }
      } else {
        merged.unshift(le)
      }
    })

    return merged
  } catch {
    return dbExams
  }
}

export const getExamById = async (examId) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select(`*, courses ( course_name ), users ( full_name )`)
      .eq('exam_id', examId)
      .maybeSingle()
    if (!error && data) return data
  } catch {}

  try {
    const { data } = await supabase.from('exams').select('*').eq('exam_id', examId).maybeSingle()
    if (data) return data
  } catch {}

  try {
    const localExams = JSON.parse(localStorage.getItem('oems_exams') || '[]')
    const found = localExams.find(e => e.exam_id === examId)
    if (found) return found
  } catch {}

  return { exam_id: examId, exam_title: 'Examination', total_marks: 100 }
}

export const createExam = async (examData) => {
  try {
    const { data, error } = await supabase.from('exams').insert(examData).select().single()
    if (!error && data) {
      saveExamLocal(data)
      return data
    }
    if (error) console.error('Supabase createExam error:', error)
  } catch (err) {
    console.error('createExam catch:', err)
  }

  // Fallback for local storage / offline
  const newExam = {
    ...examData,
    exam_id: 'exam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    created_at: new Date().toISOString(),
  }
  saveExamLocal(newExam)
  return newExam
}

export const updateExam = async (examId, updates) => {
  let updatedExam = null
  try {
    const { data, error } = await supabase
      .from('exams').update(updates).eq('exam_id', examId).select().single()
    if (!error && data) {
      updatedExam = data
    }
  } catch (err) {
    console.error('updateExam error:', err)
  }

  if (!updatedExam) {
    updatedExam = { exam_id: examId, ...updates }
  }
  saveExamLocal(updatedExam)
  return updatedExam
}

export const deleteExam = async (examId) => {
  try {
    await supabase.from('exams').delete().eq('exam_id', examId)
  } catch (err) {
    console.error('deleteExam error:', err)
  }
  removeExamLocal(examId)
}

// ── Questions ──────────────────────────────────────────────────
export const getQuestions = async (examId) => {
  let dbQuestions = []
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_num')
    if (!error && data) dbQuestions = data
  } catch (err) {
    console.error('getQuestions error:', err)
  }

  try {
    const key = `oems_questions_${examId}`
    const localQuestions = JSON.parse(localStorage.getItem(key) || '[]')
    const merged = [...dbQuestions]
    localQuestions.forEach(lq => {
      if (!merged.some(q => q.question_id === lq.question_id)) {
        merged.push(lq)
      }
    })
    return merged
  } catch {
    return dbQuestions
  }
}

export const upsertQuestion = async (question) => {
  const isUpdate = Boolean(question.question_id)

  try {
    if (isUpdate) {
      const { data, error } = await supabase
        .from('questions')
        .update(question)
        .eq('question_id', question.question_id)
        .select()
        .single()
      if (!error && data) {
        saveQuestionLocal(data)
        return data
      }
      if (error) console.error('Supabase updateQuestion error:', error)
    } else {
      const { data, error } = await supabase
        .from('questions')
        .insert(question)
        .select()
        .single()
      if (!error && data) {
        saveQuestionLocal(data)
        return data
      }
      if (error) console.error('Supabase insertQuestion error:', error)
    }
  } catch (err) {
    console.error('upsertQuestion catch:', err)
  }

  // Local fallback
  const newId = question.question_id || 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
  const savedQuestion = {
    ...question,
    question_id: newId,
    created_at: question.created_at || new Date().toISOString(),
  }
  saveQuestionLocal(savedQuestion)
  return savedQuestion
}

const saveQuestionLocal = (question) => {
  try {
    const key = `oems_questions_${question.exam_id}`
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = existing.findIndex(q => q.question_id === question.question_id)
    if (idx >= 0) {
      existing[idx] = question
    } else {
      existing.push(question)
    }
    localStorage.setItem(key, JSON.stringify(existing))
  } catch (err) {
    console.error('saveQuestionLocal error:', err)
  }
}

export const deleteQuestion = async (questionId, examId) => {
  try {
    await supabase.from('questions').delete().eq('question_id', questionId)
  } catch (err) {
    console.error('deleteQuestion error:', err)
  }

  if (examId) {
    try {
      const key = `oems_questions_${examId}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const filtered = existing.filter(q => q.question_id !== questionId)
      localStorage.setItem(key, JSON.stringify(filtered))
    } catch {}
  }
}

// ── Exam Attempt ───────────────────────────────────────────────
// ── Exam Attempt ───────────────────────────────────────────────
const saveAttemptLocal = (attempt) => {
  try {
    const key = 'oems_attempts'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = existing.findIndex(a => a.student_id === attempt.student_id && a.exam_id === attempt.exam_id)
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...attempt }
    } else {
      existing.unshift(attempt)
    }
    localStorage.setItem(key, JSON.stringify(existing))
  } catch (err) {
    console.error('saveAttemptLocal error:', err)
  }
}

const saveResultLocal = (result) => {
  try {
    const key = 'oems_results'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const idx = existing.findIndex(r => r.student_id === result.student_id && r.exam_id === result.exam_id)
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...result }
    } else {
      existing.unshift(result)
    }
    localStorage.setItem(key, JSON.stringify(existing))
  } catch (err) {
    console.error('saveResultLocal error:', err)
  }
}

export const getStudentAttempts = async (studentId) => {
  let dbAttempts = []
  try {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('exam_id, status, submitted_at')
      .eq('student_id', studentId)
    if (!error && data) dbAttempts = data
  } catch (err) {
    console.error('getStudentAttempts DB error:', err)
  }

  try {
    const localAttempts = JSON.parse(localStorage.getItem('oems_attempts') || '[]')
    const localResults = JSON.parse(localStorage.getItem('oems_results') || '[]')

    const merged = [...dbAttempts]

    localAttempts.forEach(la => {
      if (la.student_id === studentId) {
        const idx = merged.findIndex(a => a.exam_id === la.exam_id)
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...la }
        } else {
          merged.push(la)
        }
      }
    })

    localResults.forEach(lr => {
      if (lr.student_id === studentId) {
        const idx = merged.findIndex(a => a.exam_id === lr.exam_id)
        if (idx >= 0) {
          if (merged[idx].status === 'In Progress') {
            merged[idx].status = 'Submitted'
          }
        } else {
          merged.push({ exam_id: lr.exam_id, status: 'Submitted', submitted_at: lr.published_at })
        }
      }
    })

    return merged
  } catch {
    return dbAttempts
  }
}

export const startAttempt = async (studentId, examId) => {
  try {
    const { data: existing } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('student_id', studentId)
      .eq('exam_id', examId)
      .maybeSingle()
    if (existing) {
      saveAttemptLocal(existing)
      return existing
    }

    const { data, error } = await supabase
      .from('exam_attempts')
      .insert({ student_id: studentId, exam_id: examId, status: 'In Progress' })
      .select().single()
    if (!error && data) {
      saveAttemptLocal(data)
      return data
    }
    if (error) console.error('Supabase startAttempt error:', error)
  } catch (err) {
    console.error('startAttempt catch:', err)
  }

  // Fallback to localStorage
  try {
    const key = 'oems_attempts'
    const local = JSON.parse(localStorage.getItem(key) || '[]')
    const existing = local.find(a => a.student_id === studentId && a.exam_id === examId)
    if (existing) return existing

    const newAttempt = {
      attempt_id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      student_id: studentId,
      exam_id: examId,
      status: 'In Progress',
      started_at: new Date().toISOString(),
    }
    saveAttemptLocal(newAttempt)
    return newAttempt
  } catch {
    return {
      attempt_id: 'att_' + Date.now(),
      student_id: studentId,
      exam_id: examId,
      status: 'In Progress',
      started_at: new Date().toISOString(),
    }
  }
}

export const saveAnswer = async (attemptId, questionId, selectedAnswer) => {
  try {
    const { data, error } = await supabase
      .from('student_answers')
      .upsert(
        { attempt_id: attemptId, question_id: questionId, selected_answer: selectedAnswer },
        { onConflict: 'attempt_id,question_id' }
      )
      .select().single()
    if (!error && data) return data
  } catch (err) {
    console.error('saveAnswer catch:', err)
  }

  try {
    const key = `oems_answers_${attemptId}`
    const local = JSON.parse(localStorage.getItem(key) || '{}')
    local[questionId] = selectedAnswer
    localStorage.setItem(key, JSON.stringify(local))
  } catch {}
}

export const submitExam = async (attemptId, examId, studentId, status = 'Submitted') => {
  const submittedAt = new Date().toISOString()

  // 1. Mark attempt as submitted in DB & local
  try {
    await supabase
      .from('exam_attempts')
      .update({ status, submitted_at: submittedAt })
      .eq('attempt_id', attemptId)
  } catch {}

  saveAttemptLocal({ attempt_id: attemptId, student_id: studentId, exam_id: examId, status, submitted_at: submittedAt })

  // 2. Load questions
  const questions = await getQuestions(examId)

  // 3. Load answers (DB + local)
  let answers = []
  try {
    const { data } = await supabase.from('student_answers').select('*').eq('attempt_id', attemptId)
    if (data) answers = data
  } catch {}

  const answerMap = {}
  for (const a of answers) answerMap[a.question_id] = a.selected_answer

  try {
    const key = `oems_answers_${attemptId}`
    const localAnswers = JSON.parse(localStorage.getItem(key) || '{}')
    Object.assign(answerMap, localAnswers)
  } catch {}

  // 4. Evaluate using grade calculator
  const { obtained, total, percentage, grade, status: resultStatus, answerResults } = evaluateExam(questions, answerMap)

  // 5. Update DB per-question marks if possible
  try {
    const updates = answerResults.map(ar =>
      supabase.from('student_answers')
        .update({ obtained_marks: ar.obtained_marks })
        .eq('attempt_id', attemptId)
        .eq('question_id', ar.question_id)
    )
    await Promise.all(updates)
  } catch {}

  // Resolve student info for result metadata
  let studentInfo = { full_name: 'Student', email: '' }
  try {
    const localUser = JSON.parse(localStorage.getItem('oems_user') || '{}')
    if (localUser && (localUser.id === studentId || localUser.uid === studentId)) {
      studentInfo.full_name = localUser.full_name || localUser.name || 'Student'
      studentInfo.email = localUser.email || ''
    }
  } catch {}

  if (studentInfo.full_name === 'Student') {
    try {
      const localStudents = JSON.parse(localStorage.getItem('oems_students') || '[]')
      const s = localStudents.find(st => st.id === studentId || st.student_id === studentId)
      if (s) {
        studentInfo.full_name = s.full_name || s.name || studentInfo.full_name
        studentInfo.email = s.email || studentInfo.email
      }
    } catch {}
  }

  // 6. Write result to DB & local
  const resultObj = {
    result_id: 'res_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    student_id: studentId,
    exam_id: examId,
    attempt_id: attemptId,
    obtained_marks: obtained,
    total_marks: total,
    percentage,
    grade,
    status: resultStatus,
    published_at: submittedAt,
    users: studentInfo,
    student_name: studentInfo.full_name,
  }

  try {
    const { data, error } = await supabase
      .from('results')
      .upsert({
        student_id: studentId,
        exam_id: examId,
        attempt_id: attemptId,
        obtained_marks: obtained,
        total_marks: total,
        percentage,
        grade,
        status: resultStatus,
      }, { onConflict: 'student_id,exam_id' })
      .select().single()
    if (!error && data) {
      const enrichedData = { ...data, users: data.users?.full_name ? data.users : studentInfo, student_name: data.users?.full_name || studentInfo.full_name }
      saveResultLocal(enrichedData)
      return enrichedData
    }
  } catch (err) {
    console.error('submitExam DB result error:', err)
  }

  saveResultLocal(resultObj)
  return resultObj
}

// ── Results ────────────────────────────────────────────────────
export const getResultByStudentAndExam = async (studentId, examId) => {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*, exams ( exam_title, total_marks ), users ( full_name )')
      .eq('student_id', studentId)
      .eq('exam_id', examId)
      .maybeSingle()
    if (!error && data) return data
  } catch {}

  try {
    const localResults = JSON.parse(localStorage.getItem('oems_results') || '[]')
    const found = localResults.find(r => r.student_id === studentId && r.exam_id === examId)
    if (found) {
      const exam = await getExamById(examId)
      return {
        ...found,
        exams: { exam_title: exam?.exam_title || 'Examination', total_marks: exam?.total_marks || 100 }
      }
    }
  } catch {}

  return null
}

export const getAllResults = async (filters = {}) => {
  let dbResults = []
  try {
    let query = supabase.from('results').select(`
      *,
      users ( full_name, email ),
      exams ( exam_title, total_marks )
    `).order('published_at', { ascending: false })

    if (filters.exam_id)   query = query.eq('exam_id', filters.exam_id)
    if (filters.student_id) query = query.eq('student_id', filters.student_id)

    const { data, error } = await query
    if (!error && data) dbResults = data
  } catch (err) {
    console.error('getAllResults error:', err)
  }

  let merged = [...dbResults]
  try {
    const localResults = JSON.parse(localStorage.getItem('oems_results') || '[]')
    localResults.forEach(lr => {
      if (filters.exam_id && lr.exam_id !== filters.exam_id) return
      if (filters.student_id && lr.student_id !== filters.student_id) return

      const idx = merged.findIndex(r => r.student_id === lr.student_id && r.exam_id === lr.exam_id)
      if (idx >= 0) {
        merged[idx] = { ...lr, ...merged[idx], users: merged[idx].users?.full_name ? merged[idx].users : (lr.users || merged[idx].users) }
      } else {
        merged.push(lr)
      }
    })
  } catch {}

  try {
    const allStudents = await getStudents().catch(() => [])
    const studentMap = new Map()
    allStudents.forEach(s => {
      if (s.id) studentMap.set(s.id, s)
      if (s.student_id) studentMap.set(s.student_id, s)
    })

    const enriched = await Promise.all(merged.map(async r => {
      let users = r.users
      if (!users || !users.full_name) {
        const matched = studentMap.get(r.student_id)
        if (matched && matched.full_name) {
          users = { full_name: matched.full_name, email: matched.email || '' }
        } else {
          try {
            const localUser = JSON.parse(localStorage.getItem('oems_user') || '{}')
            if (localUser && (localUser.id === r.student_id || localUser.uid === r.student_id)) {
              users = { full_name: localUser.full_name || 'Student', email: localUser.email || '' }
            }
          } catch {}
        }
      }

      let exams = r.exams
      if (!exams || !exams.exam_title) {
        const ex = await getExamById(r.exam_id).catch(() => null)
        if (ex) {
          exams = { exam_title: ex.exam_title, total_marks: ex.total_marks }
        }
      }

      const finalName = users?.full_name || r.student_name || r.full_name || 'Student'
      return {
        ...r,
        users: { full_name: finalName, email: users?.email || r.email || '' },
        student_name: finalName,
        exams: exams || { exam_title: r.exam_title || 'Examination', total_marks: r.total_marks || 100 }
      }
    }))
    return enriched
  } catch (err) {
    console.error('getAllResults enrichment error:', err)
    return merged
  }
}

export const getStudentResults = async (studentId) => {
  let dbResults = []
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*, exams ( exam_title, total_marks )')
      .eq('student_id', studentId)
      .order('published_at', { ascending: false })
    if (!error && data) dbResults = data
  } catch (err) {
    console.error('getStudentResults catch:', err)
  }

  try {
    const localResults = JSON.parse(localStorage.getItem('oems_results') || '[]')
    const merged = [...dbResults]
    localResults.forEach(lr => {
      if (lr.student_id === studentId && !merged.some(r => r.exam_id === lr.exam_id)) {
        merged.push(lr)
      }
    })
    return merged
  } catch {
    return dbResults
  }
}

export const getAttemptAnswers = async (attemptId) => {
  try {
    const { data, error } = await supabase
      .from('student_answers')
      .select('*, questions ( question_text, correct_answer, marks, question_type )')
      .eq('attempt_id', attemptId)
    if (!error && data) return data
  } catch (err) {
    console.error('getAttemptAnswers error:', err)
  }
  return []
}
