# HIRED - Job Portal Platform

A comprehensive full-stack job portal connecting recruiters and candidates with advanced security features and admin management.

## 🚀 Features

### For Candidates
- **Job Search & Discovery** - Browse and filter job opportunities
- **Application Management** - Apply to jobs with resume upload
- **Saved Jobs** - Bookmark interesting positions
- **Application Tracking** - Monitor application status in real-time
- **Profile Management** - Manage personal information and preferences

### For Recruiters
- **Job Posting** - Create and manage job listings
- **Company Management** - Add company profiles with branding
- **Application Review** - Review and manage candidate applications
- **Status Updates** - Update application status (Applied, Interviewing, Hired, Rejected)
- **Candidate Communication** - Track and manage recruitment pipeline

### For Admins
- **User Management** - Ban/unban users, delete accounts
- **Content Moderation** - Review and manage all job postings
- **Suspicious Job Detection** - AI-free pattern-based scam detection
- **Platform Analytics** - Monitor platform usage and statistics
- **Security Controls** - Advanced admin tools for platform safety

## 🔍 Suspicious Job Detection System

Our innovative **AI-free detection system** automatically identifies potential scam jobs using pattern matching:

- **High Salary Red Flags** - Unrealistic salary mentions
- **Scam Keywords** - "Get rich quick", "Easy money", MLM patterns
- **Crypto/Trading Scams** - Bitcoin, forex, investment schemes
- **Structural Issues** - Short descriptions, external links, vague titles
- **Company Verification** - Suspicious company names and missing info

## 🛡️ Security Features

- **Role-Based Access Control** - Candidates, Recruiters, Admins
- **Secure Authentication** - Clerk-powered OAuth and email/password
- **File Upload Security** - Safe resume and logo handling
- **Input Validation** - Comprehensive server-side validation
- **Protected Routes** - Route-level security implementation

## 🏗️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful and accessible component library
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation

### Backend
- **Express.js** - Fast, unopinionated web framework
- **Node.js** - JavaScript runtime environment
- **RESTful API** - Clean and intuitive API design

### Database & Authentication
- **Supabase** - PostgreSQL database with real-time features
- **Clerk** - Complete authentication and user management
- **File Storage** - Secure file handling for resumes and logos

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Git** - Version control with GitHub integration
- **VS Code** - Development environment setup

## 📊 Database Schema

### Core Entities

**Users** (Clerk Managed)
- User profiles, roles, authentication tokens

**Jobs**
```sql
- id, title, description, location, company_id
- recruiter_id, requirements, salary_range
- isOpen, created_at, updated_at
```

**Companies**
```sql
- id, name, logo_url, description
- website, created_at
```

**Applications**
```sql
- id, job_id, candidate_id, name
- experience, skills, education, resume_url
- status (applied/interviewing/hired/rejected)
```

**Saved Jobs**
```sql
- id, user_id, job_id, created_at
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Git for version control

### 1. Clone Repository
```bash
git clone https://github.com/saram-x/HIRED.git
cd HIRED
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Environment Configuration

Create `.env` file in project root:
```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
VITE_API_URL=http://localhost:3001
```

Create `.env` file in server directory:
```env
# Clerk Server
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
PORT=3001
```

### 4. Database Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run database migrations:
```sql
-- Create tables for jobs, companies, applications, saved_jobs
-- (SQL schema available in /database/schema.sql)
```

### 5. Authentication Setup

1. Create Clerk application at [clerk.com](https://clerk.com)
2. Configure OAuth providers (Google, GitHub, etc.)
3. Set up user roles and metadata

### 6. Run Application

```bash
# Start backend server
cd server
npm start

# Start frontend (in new terminal)
cd ..
npm run dev
```

## 🎯 API Endpoints
```

### Jobs Management
```
GET  /api/jobs               # Get all jobs
POST /api/jobs               # Create new job
PUT  /api/jobs/:id           # Update job
DEL  /api/jobs/:id           # Delete job
GET  /api/jobs/user/:id      # Get user's jobs
```

### Applications
```
GET  /api/applications       # Get applications
POST /api/applications       # Submit application
PUT  /api/applications/:id   # Update application status
DEL  /api/applications/:id   # Delete application
```

### Companies
```
GET  /api/companies          # Get all companies
POST /api/companies          # Add new company
PUT  /api/companies/:id      # Update company
DEL  /api/companies/:id      # Delete company
```

```

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
```

## 📱 Responsive Design

- **Mobile First** - Optimized for mobile devices
- **Tablet Support** - Responsive layouts for tablets
- **Desktop Enhanced** - Full-featured desktop experience
- **Cross-browser** - Compatible with all modern browsers

## 🎨 UI Components

Built with **Shadcn/ui** component library:

- **Forms** - Beautiful, accessible form components
- **Tables** - Data tables with sorting and filtering
- **Modals** - Confirmation dialogs and drawers
- **Navigation** - Sidebar and header navigation
- **Feedback** - Toast notifications and loading states

## 🔐 Security Best Practices

- **Input Sanitization** - XSS protection
- **SQL Injection Prevention** - Parameterized queries
- **File Upload Security** - Type and size validation
- **Rate Limiting** - API abuse prevention
- **HTTPS Enforcement** - Secure data transmission
- **Environment Variables** - Secure configuration management

## 📈 Performance Optimizations

- **Code Splitting** - Lazy loading of components
- **Image Optimization** - Compressed and responsive images
- **Caching Strategies** - Browser and API caching
- **Bundle Optimization** - Minimized JavaScript bundles
- **Database Indexing** - Optimized query performance

## 🧪 Testing

```bash
# Unit Tests
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# E2E Tests
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:ui      # Run E2E tests with UI
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder to hosting platform
```

### Backend (Railway/Heroku)
```bash
# Deploy server/ directory to cloud platform
# Ensure environment variables are configured
```

### Database (Supabase)
- Production database automatically managed
- SSL connections enforced
- Automatic backups enabled

## 📊 Project Statistics

- **Total Lines of Code:** ~15,000+ lines
- **Components:** 25+ reusable React components
- **API Endpoints:** 15+ RESTful endpoints
- **Database Tables:** 8 optimized tables
- **Security Patterns:** 8 detection algorithms
- **Code Reduction:** 75% through refactoring (AdminPage: 900→223 lines)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 👨‍💻 Developer

**Saram Khan**
- GitHub: [@saram-x](https://github.com/saram-x)
- Project: [HIRED Job Portal](https://github.com/saram-x/HIRED)

## 🙏 Acknowledgments

- **Clerk** - Authentication and user management
- **Supabase** - Database and backend services
- **Shadcn/ui** - Beautiful component library
- **Tailwind CSS** - Utility-first CSS framework
- **React Community** - Amazing ecosystem and resources

---

**Built with ❤️ for connecting talent with opportunities**
---

*This project was developed as a Final Year Project (FYP) demonstrating full-stack development skills, security implementation, and modern web application architecture.*
