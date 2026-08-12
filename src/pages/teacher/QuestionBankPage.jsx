import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getExamById, getQuestions, upsertQuestion, deleteQuestion } from '../../services/examService'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import toast from 'react-hot-toast'
import { MdAdd, MdEdit, MdDelete, MdArrowBack } from 'react-icons/md'

const QTYPES = [
  { value: 'MCQ', label: 'Multiple Choice (MCQ)' },
  { value: 'True-False', label: 'True / False' },
  { value: 'Fill-in-Blank', label: 'Fill in the Blank' },
  { value: 'Short Answer', label: 'Short Answer' },
]

const EMPTY_Q = {
  question_text: '', question_type: 'MCQ',
  option_a: '', option_b: '', option_c: '', option_d: '',
  correct_answer: 'A', marks: 1,
}

export default function QuestionBankPage() {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'add'|'edit'|'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_Q)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [e, qs] = await Promise.all([getExamById(examId), getQuestions(examId)])
      setExam(e)
      setQuestions(qs || [])
    } catch (err) {
      console.error('Load questions error:', err)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [examId])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleTypeChange = (newType) => {
    let defAnswer = ''
    if (newType === 'MCQ') defAnswer = 'A'
    else if (newType === 'True-False') defAnswer = 'True'
    setForm(p => ({ ...p, question_type: newType, correct_answer: defAnswer }))
  }

  const openAdd = () => { setForm(EMPTY_Q); setSelected(null); setModal('edit') }
  const openEdit = (q) => {
    setSelected(q)
    setForm({
      question_text: q.question_text || '',
      question_type: q.question_type || 'MCQ',
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      correct_answer: q.correct_answer || (q.question_type === 'MCQ' ? 'A' : q.question_type === 'True-False' ? 'True' : ''),
      marks: q.marks || 1,
    })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.question_text.trim()) return toast.error('Question text is required.')
    
    if (form.question_type === 'MCQ') {
      if (!form.option_a.trim() || !form.option_b.trim()) {
        return toast.error('Please fill at least Option A and Option B for MCQ.')
      }
      if (!form.correct_answer) {
        return toast.error('Please select the correct option.')
      }
    } else if (form.question_type === 'True-False') {
      if (!form.correct_answer) {
        return toast.error('Please select True or False.')
      }
    } else if (form.question_type === 'Fill-in-Blank') {
      if (!form.correct_answer.trim()) {
        return toast.error('Please enter the expected correct answer.')
      }
    }

    setSaving(true)
    try {
      await upsertQuestion({
        ...(selected?.question_id ? { question_id: selected.question_id } : {}),
        exam_id: examId,
        question_text: form.question_text,
        question_type: form.question_type,
        option_a: form.question_type === 'MCQ' ? form.option_a : null,
        option_b: form.question_type === 'MCQ' ? form.option_b : null,
        option_c: form.question_type === 'MCQ' ? form.option_c : null,
        option_d: form.question_type === 'MCQ' ? form.option_d : null,
        correct_answer: form.correct_answer,
        marks: parseInt(form.marks) || 1,
        order_num: selected ? selected.order_num : questions.length,
      })
      toast.success(selected ? 'Question updated!' : 'Question added!')
      setModal(null)
      load()
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Failed to save question.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await deleteQuestion(selected.question_id, examId)
      toast.success('Question deleted.')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Failed to delete question.')
    } finally {
      setSaving(false)
    }
  }

  const showOptions = form.question_type === 'MCQ'
  const showTF = form.question_type === 'True-False'
  const totalMarks = questions.reduce((a, q) => a + q.marks, 0)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500">
            <MdArrowBack className="text-xl" />
          </button>
          <div>
            <h1 className="page-title">{exam?.exam_title}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {questions.length} questions • {totalMarks} marks total
              {exam && ` • Target: ${exam.total_marks} marks`}
            </p>
          </div>
        </div>
        <Button variant="primary" icon={<MdAdd />} onClick={openAdd}>Add Question</Button>
      </div>

      {/* Marks warning */}
      {exam && totalMarks !== exam.total_marks && questions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          ⚠️ Question marks total ({totalMarks}) does not match exam total marks ({exam.total_marks}). Consider adjusting.
        </div>
      )}

      {/* Question list */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-4">📝</p>
          <p className="text-gray-500 font-medium">No questions yet.</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Question" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.question_id} className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <Badge label={q.question_type} />
                    <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mb-3">{q.question_text}</p>
                  {q.question_type === 'MCQ' && (
                    <div className="grid grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const val = q[`option_${opt.toLowerCase()}`]
                        if (!val) return null
                        const isCorrect = q.correct_answer?.toUpperCase() === opt
                        return (
                          <div key={opt} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isCorrect ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-50 text-gray-600'}`}>
                            <span className="font-bold">{opt}.</span> {val}
                            {isCorrect && <span className="ml-auto">✓</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                  {q.question_type === 'True-False' && (
                    <p className="text-xs text-green-700 font-semibold">Answer: {q.correct_answer}</p>
                  )}
                  {(q.question_type === 'Fill-in-Blank') && (
                    <p className="text-xs text-green-700 font-semibold">Answer: {q.correct_answer}</p>
                  )}
                  {q.question_type === 'Short Answer' && (
                    <p className="text-xs text-blue-500 italic">Manual grading required.</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" icon={<MdEdit />} onClick={() => openEdit(q)} />
                  <Button variant="danger" size="sm" icon={<MdDelete />} onClick={() => { setSelected(q); setModal('delete') }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Question Modal */}
      <Modal isOpen={modal === 'edit'} onClose={() => setModal(null)} title={selected ? 'Edit Question' : 'Add Question'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" loading={saving} onClick={handleSave}>Save Question</Button></>}>
        <div className="space-y-4">
          <div>
            <label className="form-label">Question Text <span className="text-red-500">*</span></label>
            <textarea
              value={form.question_text}
              onChange={e => set('question_text', e.target.value)}
              rows={3}
              placeholder="Enter the question..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Question Type" value={form.question_type} onChange={e => handleTypeChange(e.target.value)} options={QTYPES} />
            <Input label="Marks" type="number" value={form.marks} onChange={e => set('marks', e.target.value)} min={1} />
          </div>

          {showOptions && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Option A" value={form.option_a} onChange={e => set('option_a', e.target.value)} placeholder="Option A" />
              <Input label="Option B" value={form.option_b} onChange={e => set('option_b', e.target.value)} placeholder="Option B" />
              <Input label="Option C" value={form.option_c} onChange={e => set('option_c', e.target.value)} placeholder="Option C" />
              <Input label="Option D" value={form.option_d} onChange={e => set('option_d', e.target.value)} placeholder="Option D" />
              <Select label="Correct Answer" value={form.correct_answer} onChange={e => set('correct_answer', e.target.value)} placeholder="Select correct option"
                options={[{value:'A',label:'A'},{value:'B',label:'B'},{value:'C',label:'C'},{value:'D',label:'D'}]}
                className="col-span-2" />
            </div>
          )}
          {showTF && (
            <Select label="Correct Answer" value={form.correct_answer} onChange={e => set('correct_answer', e.target.value)} placeholder="Select"
              options={[{value:'True',label:'True'},{value:'False',label:'False'}]} />
          )}
          {(form.question_type === 'Fill-in-Blank') && (
            <Input label="Correct Answer" value={form.correct_answer} onChange={e => set('correct_answer', e.target.value)} placeholder="Expected answer" />
          )}
          {form.question_type === 'Short Answer' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
              Short answer questions require manual grading after submission.
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modal === 'delete'} onClose={() => setModal(null)} title="Delete Question" size="sm"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" loading={saving} onClick={handleDelete}>Delete</Button></>}>
        <p className="text-sm text-gray-600">Delete this question? This cannot be undone.</p>
      </Modal>
    </div>
  )
}
