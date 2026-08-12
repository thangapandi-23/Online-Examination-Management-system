/**
 * Converts a percentage score to a letter grade per OEMS grading scale.
 */
export function calculateGrade(percentage) {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 40) return 'D'
  return 'F'
}

/**
 * Returns a Tailwind color class for a given grade.
 */
export function gradeColor(grade) {
  const map = {
    'A+': 'text-green-600',
    'A':  'text-green-500',
    'B+': 'text-blue-600',
    'B':  'text-blue-500',
    'C':  'text-yellow-600',
    'D':  'text-orange-500',
    'F':  'text-red-600',
  }
  return map[grade] || 'text-gray-600'
}

/**
 * Returns Pass/Fail status string.
 */
export function getStatus(grade) {
  return grade === 'F' ? 'Fail' : 'Pass'
}

/**
 * Evaluates objective answers and returns per-question marks.
 * @param {Array} questions - Array of { question_id, correct_answer, marks }
 * @param {Object} answers  - Map of { question_id: selected_answer }
 * @returns {{ obtained, total, percentage, grade, status, answerResults }}
 */
export function evaluateExam(questions, answers) {
  let obtained = 0
  let total = 0
  const answerResults = []

  for (const q of questions) {
    const selected = answers[q.question_id] || ''
    const isCorrect = q.question_type !== 'Short Answer'
      ? selected.trim().toLowerCase() === (q.correct_answer || '').trim().toLowerCase()
      : null // Short answers require manual grading

    const earnedMarks = isCorrect === true ? q.marks : 0
    obtained += earnedMarks
    total += q.marks
    answerResults.push({
      question_id: q.question_id,
      selected_answer: selected,
      obtained_marks: isCorrect === null ? null : earnedMarks,
      is_correct: isCorrect,
    })
  }

  const percentage = total > 0 ? parseFloat(((obtained / total) * 100).toFixed(2)) : 0
  const grade = calculateGrade(percentage)
  const status = getStatus(grade)

  return { obtained, total, percentage, grade, status, answerResults }
}
