# MOLEK School Admin Dashboard

React admin interface for managing students, scores, results, and school website content.

**Live:** [admin.molekschool.com](https://admin.molekschool.com)

## Stack

- React 18 / Vite / Tailwind CSS
- Lucide React — icons
- React Router — client-side routing
- JWT — authentication via Django backend

## Quick Start

```bash
npm install
cp .env.example .env   # Set VITE_API_BASE_URL
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |

## Features

### Dashboard
Workflow-guided homepage with 4-step process: Setup → Students → Scores → Results. Real-time stat cards and quick action buttons.

### Student Management
Paginated list with debounced search, class and status filters. Checkbox multi-select for bulk operations. Class-filtered CSV and CBT exports. Bulk activate/deactivate by class. Duplicate detection and cleanup.

### Unified Score Upload
Single CSV for all score components (CA1, CA2, OBJ, Theory). Class-filtered template download pre-filled with student names. Session/term selection. Total ≤ 100 validation. CA optional for SS3.

### Results Manager
Filterable results table with inline edit/delete. Grade badges, position display, brought-forward cumulative columns. Recalculate button for totals, grades, and positions.

### Academic Setup
Create and manage sessions, terms, class levels, and subjects.

### Content / News / Galleries
School website content management with Cloudinary media storage. Publish/unpublish toggle. Image and video preview.

## Project Structure

```
src/
├── api/endpoints.js              # API client
├── components/
│   ├── layout/
│   │   ├── Header.jsx            # Top bar, user dropdown
│   │   ├── Sidebar.jsx           # Grouped navigation (lucide icons)
│   │   ├── MainLayout.jsx        # Layout wrapper
│   │   └── PrivateRoute.jsx      # Auth guard
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Modal.jsx
│       └── Table.jsx
├── context/AuthContext.jsx        # JWT auth state
├── hooks/useAuth.js
├── pages/
│   ├── Dashboard.jsx              # Workflow guide + stats
│   ├── Studentslist.jsx           # Student CRUD + bulk ops
│   ├── UnifiedScoreUpload.jsx     # Single CSV score upload
│   ├── ExamResultsManager.jsx     # Results table + edit
│   ├── Academicsetup.jsx          # Sessions, terms, classes
│   ├── StudentPromotion.jsx       # Promotion workflow
│   ├── ContentList.jsx            # Content management
│   ├── GalleryList.jsx            # Gallery management
│   └── ... (15 pages total)
└── routes.jsx
```

## Design

- Light mode — clean, professional, teacher-friendly
- Lucide React icons (no emojis in production UI)
- Grouped sidebar: Overview / People / Academics / Website
- Human-readable messages ("Could not load results" not "Error 500")
- Responsive — works on tablet and desktop

## Deployment

- **Hosting:** Vercel
- **Domain:** admin.molekschool.com
- **Build:** `npm run build`

## Related

- [Backend API](https://molek-school-backend-production.up.railway.app) — Django REST
- [Student Portal](https://molekschool.com) — React
- CBT System — Electron (offline)
