-- ============================================================
-- OEMS — Online Examination Management System
-- Complete Database Schema for Supabase PostgreSQL
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS (linked to Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  phone         VARCHAR(20),
  profile_photo TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON public.users(role);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  department_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_name VARCHAR(100) NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.courses (
  course_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_name   VARCHAR(100) NOT NULL,
  department_id UUID REFERENCES public.departments(department_id) ON DELETE SET NULL,
  semester      INTEGER,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  subject_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(20),
  course_id    UUID REFERENCES public.courses(course_id) ON DELETE SET NULL,
  teacher_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_code       ON public.subjects(subject_code);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON public.subjects(teacher_id);

-- ============================================================
-- 5. STUDENTS (extends users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
  student_id      UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  register_number VARCHAR(20) UNIQUE,
  course_id       UUID REFERENCES public.courses(course_id) ON DELETE SET NULL,
  semester        INTEGER,
  section         VARCHAR(10),
  admission_year  INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_register ON public.students(register_number);

-- ============================================================
-- 6. TEACHERS (extends users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teachers (
  teacher_id    UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  employee_id   VARCHAR(20) UNIQUE,
  designation   VARCHAR(50),
  department_id UUID REFERENCES public.departments(department_id) ON DELETE SET NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_employee ON public.teachers(employee_id);

-- ============================================================
-- 7. EXAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exams (
  exam_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_title     VARCHAR(200) NOT NULL,
  course_id      UUID REFERENCES public.courses(course_id) ON DELETE SET NULL,
  created_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  instructions   TEXT,
  duration       INTEGER NOT NULL,  -- minutes
  total_marks    INTEGER NOT NULL DEFAULT 100,
  passing_marks  INTEGER NOT NULL DEFAULT 40,
  negative_marks BOOLEAN DEFAULT FALSE,
  start_time     TIMESTAMP WITH TIME ZONE,
  end_time       TIMESTAMP WITH TIME ZONE,
  status         VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Closed')),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_course_id   ON public.exams(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_created_by  ON public.exams(created_by);
CREATE INDEX IF NOT EXISTS idx_exams_start_time  ON public.exams(start_time);
CREATE INDEX IF NOT EXISTS idx_exams_status      ON public.exams(status);

-- ============================================================
-- 8. QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.questions (
  question_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id        UUID NOT NULL REFERENCES public.exams(exam_id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  question_type  VARCHAR(30) NOT NULL CHECK (question_type IN ('MCQ', 'True-False', 'Fill-in-Blank', 'Short Answer')),
  option_a       TEXT,
  option_b       TEXT,
  option_c       TEXT,
  option_d       TEXT,
  correct_answer TEXT,
  marks          INTEGER NOT NULL DEFAULT 1,
  order_num      INTEGER DEFAULT 0,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id);

-- ============================================================
-- 9. EXAM ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  attempt_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id      UUID NOT NULL REFERENCES public.exams(exam_id) ON DELETE CASCADE,
  started_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  status       VARCHAR(20) NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'Submitted', 'Timeout')),
  UNIQUE(student_id, exam_id)  -- One attempt per student per exam
);

CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON public.exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_exam_id    ON public.exam_attempts(exam_id);

-- ============================================================
-- 10. STUDENT ANSWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_answers (
  answer_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id      UUID NOT NULL REFERENCES public.exam_attempts(attempt_id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES public.questions(question_id) ON DELETE CASCADE,
  selected_answer TEXT,
  obtained_marks  INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt_id  ON public.student_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.student_answers(question_id);

-- ============================================================
-- 11. RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.results (
  result_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id        UUID NOT NULL REFERENCES public.exams(exam_id) ON DELETE CASCADE,
  attempt_id     UUID REFERENCES public.exam_attempts(attempt_id) ON DELETE SET NULL,
  obtained_marks INTEGER NOT NULL DEFAULT 0,
  total_marks    INTEGER NOT NULL DEFAULT 0,
  percentage     DECIMAL(5,2) NOT NULL DEFAULT 0,
  grade          VARCHAR(5) NOT NULL,
  status         VARCHAR(10) NOT NULL CHECK (status IN ('Pass', 'Fail')),
  published_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_results_student_id ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_id    ON public.results(exam_id);

-- ============================================================
-- 12. ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  attendance_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id             UUID REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  attendance_percentage  DECIMAL(5,2) DEFAULT 0,
  last_updated           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ============================================================
-- PERMISSIONS & ACCESS CONTROL
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated, anon, service_role;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- TRIGGER: Auto-create user profile on auth.users insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
