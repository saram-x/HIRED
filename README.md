# 🚀 HIRED - Job Portal Platform

A modern, full-stack job portal built with React, Express.js, Supabase, and Clerk authentication.

## 📁 Project Structure

### Frontend (`src/`)
```
src/
├── api/                    # API functions for data operations
│   ├── apiJobs.js         # Job-related API calls
│   ├── apiCompanies.js    # Company management
│   └── apiApplication.js  # Application handling
├── components/            # Reusable React components
│   ├── ui/               # Shadcn/ui components
│   ├── job-card.jsx      # Job display card
│   ├── header.jsx        # Navigation header
│   ├── apply-job.jsx     # Job application drawer
│   └── ...
├── pages/                # Main page components
│   ├── landing.jsx       # Landing page
│   ├── jobListing.jsx    # Job search/listing
│   ├── post-job.jsx      # Job creation (recruiters)
│   ├── my-jobs.jsx       # User's jobs/applications
│   ├── AdminPageSimple.jsx # Admin dashboard
│   └── ...
├── hooks/                # Custom React hooks
│   └── use-fetch.js      # API data fetching hook
├── utils/                # Utility functions
│   └── supabase.js       # Supabase client configuration
└── layouts/              # Layout components
    └── app-layout.jsx    # Main app layout
```

### Backend (`server.js`)
Express.js server providing admin-level API endpoints:
- User management (Clerk integration)
- Job management with service role access
- Bypasses Supabase RLS for admin operations

## 🏗️ Architecture

### Authentication & Authorization
- **Clerk**: User authentication and management
- **Supabase RLS**: Row-level security for data access
- **Service Role**: Admin operations bypass RLS policies

### Database (Supabase)
- `jobs` table: Job postings with recruiter relations
- `companies` table: Company information and logos
- `applications` table: Job applications with resume uploads
- `saved_jobs` table: User's saved job preferences

### Key Features
1. **Role-based Access Control**
   - Candidates: Apply to jobs, save favorites
   - Recruiters: Post jobs, manage applications
   - Admins: Full platform management

2. **Real-time Data Management**
   - Live job updates
   - Application status tracking
   - User activity monitoring

3. **File Upload System**
   - Resume uploads for applications
   - Company logo management
   - Supabase storage integration

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Supabase account
- Clerk account

### Environment Setup
Create `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_SECRET_KEY=your_clerk_secret_key
```

### Installation
```bash
# Install dependencies
npm install

# Start development server (frontend)
npm run dev

# Start backend server
node server.js
```

## 🔧 Development Guidelines

### API Patterns
- All API functions require Clerk authentication token
- Use `useFetch` hook for consistent error handling
- Server-side APIs for admin operations

### Component Structure
- Functional components with hooks
- Proper prop validation with PropTypes
- Reusable UI components from shadcn/ui

### Data Flow
1. **User Actions** → API calls through `useFetch`
2. **Authentication** → Clerk session tokens
3. **Database** → Supabase with RLS policies
4. **Admin Operations** → Express server with service role

## 📚 Key Technologies

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **UI Components**: shadcn/ui, Radix UI
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (frontend), Railway/Heroku (backend)

## 🔄 Recent Updates

- ✅ Complete admin panel with user/job management
- ✅ Enhanced search functionality across all data
- ✅ Service role authentication for admin operations
- ✅ Comprehensive error handling and loading states
- ✅ Clean, commented codebase for maintainability

## 🤝 Contributing

1. Follow the established patterns for API calls
2. Add proper JSDoc comments for new functions
3. Use TypeScript-style prop validation
4. Test admin operations with service role access
5. Maintain consistent UI/UX patterns

---

**Made by Saram** 🎓
