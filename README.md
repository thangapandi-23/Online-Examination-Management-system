# Online Examination Management System (OEMS)

A modern, full-stack Online Examination Management System built with **React.js + Vite**, **Tailwind CSS v3**, and **Supabase** (Auth + PostgreSQL).

## Features

- 🔐 **Role-Based Authentication** — Admin, Teacher, Student
- 📋 **Exam Management** — Create, publish, schedule, and close exams
- ❓ **Question Bank** — MCQ, True/False, Fill-in-Blank, Short Answer
- ⏱️ **Live Exam Engine** — Timer, auto-submit, question navigator, per-answer save
- ✅ **Auto Grading** — Instant evaluation for objective questions
- 📊 **Analytics** — Grade charts, pass/fail breakdown, reports
- 📤 **CSV Export** — Download results for offline use
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18 + Vite |
| Styling | Tailwind CSS v3 |
| Backend | Supabase |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Authentication |
| Charts | Chart.js + react-chartjs-2 |
| Icons | React Icons (Material Design) |
| Notifications | react-hot-toast |

## Setup Instructions

### 1. Database Setup (REQUIRED FIRST)

1. Go to [supabase.com](https://supabase.com) and create or open your project
2. Navigate to **SQL Editor**
3. Copy the contents of `database/schema.sql`
4. Paste and run the entire SQL file
5. This creates all 12 tables, RLS policies, and triggers

### 2. Create Admin Account

After running the schema, create your first admin in Supabase:

1. Go to **Authentication → Users → Invite user**
2. Or use the Auth API to create a user with email/password
3. Then in the **SQL Editor**, run:

```sql
-- Replace 'YOUR_USER_UUID' with the UUID from Auth → Users
UPDATE public.users
SET role = 'admin'
WHERE id = 'YOUR_USER_UUID';
```

### 3. Environment Variables

Create a `.env` file in the project root (already done with your credentials):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Install & Run

```bash
npm install
npm run dev
```

App runs at **http://localhost:5173**

## Creating Users (Admin Panel)

> **Important:** Users are created by the Admin through the dashboard — NOT through public registration.

**Workflow:**
1. Admin logs in → goes to Students or Teachers section
2. Clicks "Add Student" or "Add Teacher"
3. Enters email + password → account is created
4. Student/Teacher can then log in with those credentials

## User Roles & Login

| Role | Dashboard | Access |
|---|---|---|
| `admin` | `/admin/dashboard` | Full system access |
| `teacher` | `/teacher/dashboard` | Exam creation + results |
| `student` | `/student/dashboard` | Take exams + view grades |

## Grading Scale

| Percentage | Grade |
|---|---|
| 90–100% | A+ |
| 80–89% | A |
| 70–79% | B+ |
| 60–69% | B |
| 50–59% | C |
| 40–49% | D |
| Below 40% | F |

## Deployment (Vercel / Netlify)

1. Push to GitHub
2. Connect repo to Vercel/Netlify
3. Add environment variables in dashboard settings
4. Deploy!

## Project Structure

```
src/
├── components/ui/     # Reusable UI components
├── context/           # AuthContext (global auth state)
├── layouts/           # DashboardLayout (sidebar + header)
├── lib/               # Supabase client
├── pages/
│   ├── admin/         # Admin module pages
│   ├── teacher/       # Teacher module pages
│   └── student/       # Student module pages
├── routes/            # Protected routes + AppRouter
├── services/          # Supabase data services
└── utils/             # Grade calculator + formatters
database/
└── schema.sql         # Run this in Supabase SQL Editor
```
