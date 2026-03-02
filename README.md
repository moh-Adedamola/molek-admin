# MOLEK School Admin Dashboard

Admin frontend for MOLEK Secondary Schools management system. Built with React + Vite + Tailwind CSS.

## Features

- **Student Management** — Bulk upload, individual registration, class assignment, promotion
- **CA Score Upload** — CSV import for CA1 (15 marks) + CA2 (15 marks) with class-filtered templates
- **Exam Results Import** — OBJ/CBT (30 marks) and Theory (40 marks) score upload
- **Results Manager** — View/edit results with cumulative columns (1st/2nd/3rd term B/F)
- **Report Cards** — Download MOLEK Recording Sheet format (term or cumulative)
- **Class Export** — Per-class and bulk CBT data export for teachers
- **Promotion System** — Configurable rules, database-driven promotion logic
- **Academic Setup** — Sessions, terms, class levels, subjects management

## Tech Stack

- **React 18** with React Router
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Axios** for API calls
- **JWT Authentication** (access + refresh tokens)

## Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000
```

For production (Railway backend):
```env
VITE_API_BASE_URL=https://molek-school-backend-production.up.railway.app
```

## Development

```bash
npm run dev
```

Runs on `http://localhost:5173` by default.

## Build & Deploy

```bash
npm run build
```

Output goes to `dist/` folder. Deploy to Vercel, Netlify, or any static host.

### Vercel Deployment

1. Connect GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_BASE_URL`

### Netlify Deployment

1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add `_redirects` file in `public/` folder:
   ```
   /*    /index.html   200
   ```

## Project Structure

```
src/
├── api/
│   └── endpoints.js          # All API endpoints (students, scores, sessions, etc.)
├── components/
│   └── ui/                   # Reusable UI components (Button, Modal, etc.)
├── context/
│   └── AuthContext.jsx        # JWT auth context provider
├── pages/
│   ├── Cascoreupload.jsx      # CA1 + CA2 score CSV upload
│   ├── Examresultsimport.jsx  # OBJ/Theory score CSV upload
│   ├── ExamResultsManager.jsx # View/edit results table with cumulative
│   ├── Studentbulkupload.jsx  # Bulk student registration via CSV
│   ├── Studentslist.jsx       # Student list with class filter & export
│   └── ...
├── App.jsx
└── main.jsx
```

## Nigerian Grading System

| Component | Max Score |
|-----------|-----------|
| CA1       | 15        |
| CA2       | 15        |
| OBJ/CBT   | 30        |
| Theory    | 40        |
| **Total** | **100**   |

| Grade | Range    | Remark      |
|-------|----------|-------------|
| A     | 75 - 100 | Excellent   |
| B     | 70 - 74  | Very Good   |
| C     | 60 - 69  | Good        |
| D     | 50 - 59  | Pass        |
| E     | 45 - 49  | Fair        |
| F     | 0 - 44   | Fail        |

## CSV Upload Workflow

1. **Download template** — Select class → get pre-filled CSV with student names
2. **Fill scores** — Enter CA1/CA2 or OBJ/Theory scores (student_name column is reference only)
3. **Upload CSV** — Select session + term → upload
4. **Verify** — Check Results Manager for accuracy

### Recommended Upload Order

1. CA Scores (CA1 + CA2)
2. OBJ/CBT Scores
3. Theory Scores
4. Verify in Results Manager

## Backend API

The admin dashboard connects to the Django backend. See the backend repo for API documentation.

**Base URL**: Set via `VITE_API_BASE_URL` environment variable.

## License

Proprietary — MOLEK Secondary Schools