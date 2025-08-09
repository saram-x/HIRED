# 🎓 HIRED Job Portal - Complete Code Explanation (A to Z)

## 📚 Table of Contents
1. [Project Overview & Architecture](#project-overview--architecture)
2. [Technology Stack Explained](#technology-stack-explained)
3. [Project Structure & File Purpose](#project-structure--file-purpose)
4. [Configuration Files](#configuration-files)
5. [Frontend Code Explanation](#frontend-code-explanation)
6. [Backend Code Explanation](#backend-code-explanation)
7. [Database & API Integration](#database--api-integration)
8. [Authentication System](#authentication-system)
9. [User Interface Components](#user-interface-components)
10. [Key Programming Concepts](#key-programming-concepts)
11. [Data Flow & Architecture](#data-flow--architecture)
12. [Interview Questions & Answers](#interview-questions--answers)

---

## 1. Project Overview & Architecture

### What is HIRED?
HIRED is a modern **job portal website** where:
- **Candidates** can search for jobs, apply to positions, and save favorite jobs
- **Recruiters** can post jobs, manage applications, and find candidates
- **Admins** can manage users and moderate the platform

### Core Architecture Pattern: **Full-Stack Web Application**
```
Frontend (React) → API Layer → Backend (Express.js) → Database (Supabase)
      ↓                ↓              ↓                    ↓
  User Interface   Data Requests   Business Logic    Data Storage
```

---

## 2. Technology Stack Explained

### Frontend Technologies
- **React (18.3.1)**: JavaScript library for building user interfaces
- **Vite**: Build tool for faster development
- **TailwindCSS**: Utility-first CSS framework for styling
- **React Router**: Client-side routing for navigation
- **Clerk**: Authentication service
- **shadcn/ui**: Pre-built UI components

### Backend Technologies
- **Express.js**: Node.js web framework for API
- **Supabase**: Backend-as-a-Service (database + file storage)
- **CORS**: Cross-Origin Resource Sharing middleware
- **dotenv**: Environment variable management

### Key Concepts:
- **SPA (Single Page Application)**: React app loads once, updates content dynamically
- **REST API**: Communication between frontend and backend
- **JWT Tokens**: Secure authentication
- **RLS (Row Level Security)**: Database-level access control

---

## 3. Project Structure & File Purpose

### Root Directory Files

#### `package.json` - Project Configuration
```json
{
  "name": "job-portal",
  "scripts": {
    "dev": "vite",           // Start frontend development server
    "build": "vite build",   // Build for production
    "backend": "node server.js", // Start backend server
    "start": "concurrently \"npm run dev\" \"npm run backend\"" // Start both
  }
}
```
**Purpose**: Defines project dependencies, scripts, and metadata.

#### `server.js` - Backend Server
**Purpose**: Express.js server that handles admin operations and Clerk API calls.

#### `vite.config.js` - Build Configuration
**Purpose**: Configures the Vite build tool for React development.

#### `tailwind.config.js` - Styling Configuration
**Purpose**: Configures TailwindCSS theme and custom styles.

### Source Code Structure (`src/`)

```
src/
├── main.jsx           // Application entry point
├── App.jsx           // Main app component with routing
├── index.css         // Global styles
├── api/              // API functions for data operations
├── components/       // Reusable UI components
├── pages/            // Main page components
├── hooks/            // Custom React hooks
├── utils/            // Utility functions
└── layouts/          // Layout components
```

---

## 4. Configuration Files Explained

### Environment Variables (`.env`)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_CLERK_SECRET_KEY=your_clerk_secret_key
```

**Explanation**:
- `VITE_` prefix: Makes variables available to frontend
- **Supabase URL/Keys**: Connect to database
- **Clerk Keys**: Handle user authentication
- **Service Role Key**: Admin-level database access

### `components.json` - UI Component Configuration
**Purpose**: Configures shadcn/ui component library settings.

### `eslint.config.js` - Code Quality
**Purpose**: Enforces coding standards and catches errors.

---

## 5. Frontend Code Explanation

### Entry Point: `main.jsx`
```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
```

**Key Concepts**:
- **ReactDOM.createRoot()**: Modern React 18 rendering method
- **ClerkProvider**: Wraps app with authentication context
- **import.meta.env**: Vite's way to access environment variables
- **React.StrictMode**: Development mode for catching issues

### Main App Component: `App.jsx`
```jsx
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import AppLayout from "./layouts/app-layout";
import ProtectedRoute from "./components/protected-route";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <ProtectedRoute><LandingPage /></ProtectedRoute>
      },
      {
        path: "/jobs",
        element: <ProtectedRoute><JobListing /></ProtectedRoute>
      }
    ]
  }
]);

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
```

**Key Concepts**:
- **createBrowserRouter**: Defines app navigation structure
- **Nested Routes**: AppLayout wraps all pages
- **ProtectedRoute**: Ensures user is authenticated
- **ThemeProvider**: Manages dark/light theme
- **Toaster**: Shows notification messages

### Layout System: `app-layout.jsx`
```jsx
import Header from "@/components/header";
import { Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div>
      <div className="grid-background"></div>
      <main className="min-h-screen container">
        <Header />
        <Outlet />  {/* Page content renders here */}
      </main>
      <div className="p-10 text-center bg-gray-800 mt-10">
        Made by MAO Students
      </div>
    </div>
  );
};
```

**Key Concepts**:
- **Outlet**: React Router component that renders child routes
- **Container**: TailwindCSS class for consistent width/padding
- **Header**: Navigation component shown on all pages

### Custom Hook: `use-fetch.js`
```javascript
import { useSession } from "@clerk/clerk-react";
import { useState } from "react";

const useFetch = (cb, options = {}) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const { session } = useSession();

  const fn = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const supabaseAccessToken = await session.getToken({
        template: "supabase",
      });
      const response = await cb(supabaseAccessToken, options, ...args);
      setData(response);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn };
};
```

**Key Concepts**:
- **Custom Hook**: Reusable logic for API calls
- **useState**: React state management
- **Clerk Session**: Gets authentication token
- **Error Handling**: Manages loading states and errors
- **Token Injection**: Adds auth token to API calls

---

## 6. Backend Code Explanation

### Express Server: `server.js`
```javascript
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
const port = 3001;

// Initialize Supabase with service role (admin access)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

app.use(cors());           // Allow cross-origin requests
app.use(express.json());   // Parse JSON request bodies

// API endpoint to get all users from Clerk
app.get("/api/get-clerk-users", async (req, res) => {
  try {
    const response = await fetch("https://api.clerk.com/v1/users", {
      headers: {
        Authorization: `Bearer ${process.env.VITE_CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const users = await response.json();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});
```

**Key Concepts**:
- **Express.js**: Web framework for Node.js
- **Middleware**: cors() and express.json() process requests
- **Service Role**: Bypasses database security for admin operations
- **Fetch API**: Makes HTTP requests to external services
- **Error Handling**: Try-catch blocks with proper status codes

### API Routes Explained

#### User Management
```javascript
// Delete user permanently
app.delete("/api/delete-user/:userId", async (req, res) => {
  const { userId } = req.params;  // Extract userId from URL
  
  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.VITE_CLERK_SECRET_KEY}`,
    },
  });
  
  res.status(200).json({ message: "User deleted successfully" });
});
```

**Key Concepts**:
- **RESTful API**: DELETE method for deletion
- **URL Parameters**: `req.params` extracts route variables
- **HTTP Headers**: Authorization with Bearer token
- **Status Codes**: 200 (success), 500 (error)

---

## 7. Database & API Integration

### Supabase Client: `utils/supabase.js`
```javascript
import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseClient = async (supabaseAccessToken) => {
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { 
      headers: { Authorization: `Bearer ${supabaseAccessToken}` } 
    },
  });
  return supabase;
};
```

**Key Concepts**:
- **Database Client**: Connection to Supabase PostgreSQL
- **Dynamic Headers**: Injects user-specific auth token
- **Row Level Security**: Database enforces user permissions

### API Functions: `api/apiJobs.js`
```javascript
// Fetch jobs with filters
export async function getJobs(token, { location, company_id, searchQuery }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select("*, saved: saved_jobs(id), company: companies(name,logo_url)");

  if (location) {
    query = query.eq("location", location);
  }
  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data, error } = await query;
  return data;
}
```

**Key Concepts**:
- **Query Builder**: Supabase provides SQL-like syntax
- **Joins**: Fetches related data (companies, saved_jobs)
- **Filtering**: Conditional WHERE clauses
- **Pattern Matching**: `ilike` for case-insensitive search

---

## 8. Authentication System

### Clerk Integration
Clerk handles all user authentication:

#### Sign-In Modal: `header.jsx`
```jsx
import { SignedIn, SignedOut, UserButton, SignIn } from "@clerk/clerk-react";

const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <nav>
      <SignedOut>
        <Button onClick={() => setShowSignIn(true)}>Login</Button>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
      
      {showSignIn && (
        <div className="modal-overlay">
          <SignIn 
            signUpForceRedirectUrl="/onboarding"
            fallbackRedirectUrl="/onboarding"
          />
        </div>
      )}
    </nav>
  );
};
```

**Key Concepts**:
- **Conditional Rendering**: Show different UI based on auth state
- **Modal Pattern**: Overlay with sign-in form
- **Redirect URLs**: Where to go after authentication

#### Role-Based Access: `onboarding.jsx`
```jsx
const Onboarding = () => {
  const { user } = useUser();
  
  const handleRoleSelection = async (role) => {
    await user.update({ 
      unsafeMetadata: { role } 
    });
    navigate(role === "recruiter" ? "/post-job" : "/jobs");
  };

  return (
    <div>
      <Button onClick={() => handleRoleSelection("candidate")}>
        Candidate
      </Button>
      <Button onClick={() => handleRoleSelection("recruiter")}>
        Recruiter
      </Button>
    </div>
  );
};
```

**Key Concepts**:
- **User Metadata**: Store additional user information
- **Role-Based Routing**: Different paths for different users
- **Async Operations**: Wait for database updates

---

## 9. User Interface Components

### Job Card Component: `job-card.jsx`
```jsx
const JobCard = ({ job, savedInit = false, onJobAction, isMyJob = false }) => {
  const [saved, setSaved] = useState(savedInit);
  const { user } = useUser();
  
  const handleSaveJob = async () => {
    await fnSavedJob({
      user_id: user.id,
      job_id: job.id,
    });
    
    toast({
      title: saved ? "Job unsaved" : "Job saved!",
      description: `"${job.title}" has been ${saved ? 'removed from' : 'added to'} your saved jobs.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{job.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <img src={job.company.logo_url} />
        <div>{job.location}</div>
        <p>{job.description}</p>
      </CardContent>
      <CardFooter>
        <Link to={`/job/${job.id}`}>
          <Button>More Details</Button>
        </Link>
        <Button onClick={handleSaveJob}>
          <Heart fill={saved ? "red" : "none"} />
        </Button>
      </CardFooter>
    </Card>
  );
};
```

**Key Concepts**:
- **Props**: Data passed from parent component
- **State Management**: Local component state with useState
- **Event Handlers**: Functions that respond to user actions
- **Conditional Styling**: Different appearance based on state
- **Toast Notifications**: User feedback for actions

### Form Handling Example
```jsx
import { useForm } from "react-hook-form";

const JobForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = async (data) => {
    try {
      await addNewJob(data);
      toast({ title: "Job posted successfully!" });
    } catch (error) {
      toast({ title: "Error posting job" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input 
        {...register("title", { required: "Title is required" })}
        placeholder="Job Title"
      />
      {errors.title && <span>{errors.title.message}</span>}
      
      <button type="submit">Post Job</button>
    </form>
  );
};
```

**Key Concepts**:
- **React Hook Form**: Library for form management
- **Validation**: Required fields and error messages
- **Spread Operator**: `...register()` adds form properties
- **Error Handling**: Display validation errors to user

---

## 10. Key Programming Concepts

### React Concepts

#### State Management
```javascript
const [data, setData] = useState(null);        // Local state
const [loading, setLoading] = useState(false);  // Loading state
const [error, setError] = useState(null);      // Error state
```

#### Effects and Lifecycle
```javascript
useEffect(() => {
  // Runs after component mounts
  fetchData();
}, []); // Empty dependency array = run once

useEffect(() => {
  // Runs when 'user' changes
  if (user?.role) {
    redirectUser(user.role);
  }
}, [user]); // Dependency array
```

#### Component Communication
```javascript
// Parent to Child: Props
<JobCard job={jobData} onSave={handleSave} />

// Child to Parent: Callback functions
const JobCard = ({ onSave }) => {
  return <button onClick={() => onSave(jobId)}>Save</button>;
};
```

### JavaScript ES6+ Features

#### Destructuring
```javascript
// Object destructuring
const { title, location, company } = job;

// Array destructuring
const [loading, setLoading] = useState(false);

// Parameter destructuring
function getJobs({ location, searchQuery }) { }
```

#### Template Literals
```javascript
const message = `Welcome to ${companyName}!`;
const query = `%${searchQuery}%`;
```

#### Arrow Functions
```javascript
// Traditional function
function handleClick() { }

// Arrow function
const handleClick = () => { };

// Implicit return
const getName = (user) => user.name;
```

#### Async/Await
```javascript
const fetchData = async () => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    setData(data);
  } catch (error) {
    setError(error.message);
  }
};
```

---

## 11. Data Flow & Architecture

### Complete Request Flow

1. **User Action**: User clicks "Save Job" button
2. **Event Handler**: `handleSaveJob()` function called
3. **Custom Hook**: `useFetch` prepares API call
4. **Authentication**: Clerk provides JWT token
5. **API Function**: `saveJob()` called with token
6. **Database Query**: Supabase executes SQL
7. **Response**: Data returns through the chain
8. **UI Update**: Component re-renders with new state
9. **User Feedback**: Toast notification shown

### Database Schema Understanding

```sql
-- Jobs table
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  location VARCHAR,
  recruiter_id VARCHAR, -- Clerk user ID
  company_id INTEGER REFERENCES companies(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  candidate_id VARCHAR, -- Clerk user ID
  resume_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Jobs table
CREATE TABLE saved_jobs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR, -- Clerk user ID
  job_id INTEGER REFERENCES jobs(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Security Architecture

#### Row Level Security (RLS)
```sql
-- Users can only see their own saved jobs
CREATE POLICY "Users can view own saved jobs" ON saved_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Users can only apply to open jobs
CREATE POLICY "Users can apply to jobs" ON applications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM jobs WHERE id = job_id AND isOpen = true)
  );
```

---

## 12. Interview Questions & Answers

### Technical Questions

**Q: How does authentication work in your application?**
A: We use Clerk for authentication. When a user signs in, Clerk provides a JWT token. This token is automatically attached to all API requests using our custom `useFetch` hook. The token is then used to authenticate with Supabase, which enforces row-level security policies to ensure users can only access their own data.

**Q: Explain the difference between frontend and backend API calls.**
A: Frontend API calls (in `src/api/`) use the user's authentication token and go through Supabase's row-level security. Backend API calls (in `server.js`) use a service role key that bypasses RLS, allowing admin operations like user management and accessing all data.

**Q: How do you handle loading states and errors?**
A: Our `useFetch` custom hook manages three states: `loading`, `data`, and `error`. We show loading spinners while requests are in progress and display error messages in toast notifications. Each API call is wrapped in try-catch blocks for proper error handling.

**Q: What is the purpose of useEffect in React?**
A: `useEffect` manages side effects in functional components. We use it for data fetching when components mount, listening to state changes, and cleanup operations. The dependency array controls when the effect runs.

### Architecture Questions

**Q: Describe your application's architecture.**
A: It's a full-stack web application with:
- **Frontend**: React SPA with client-side routing
- **Backend**: Express.js API server for admin operations
- **Database**: Supabase PostgreSQL with real-time features
- **Authentication**: Clerk handles user management
- **Deployment**: Vercel for frontend, local development for backend

**Q: How do you manage different user roles?**
A: User roles are stored in Clerk's `unsafeMetadata`. We have three roles: candidate, recruiter, and admin. The `ProtectedRoute` component checks roles for access control, and different UI elements are shown based on `user.unsafeMetadata.role`.

**Q: Explain your database relationships.**
A: 
- Jobs belong to Companies (company_id foreign key)
- Jobs belong to Recruiters (recruiter_id from Clerk)
- Applications reference Jobs and Candidates
- Saved Jobs create many-to-many relationship between Users and Jobs

### Code-Specific Questions

**Q: What is the purpose of the `useFetch` hook?**
A: It's a custom hook that standardizes API calls across the application. It automatically injects the authentication token, manages loading states, handles errors consistently, and provides a clean interface for components to make API requests.

**Q: How do you handle form submissions?**
A: We use React Hook Form for form management. It provides validation, error handling, and efficient re-rendering. Forms are submitted with `handleSubmit()`, which calls our API functions through the `useFetch` hook.

**Q: Explain the job saving functionality.**
A: When a user clicks the heart icon, it calls `handleSaveJob()`. This function checks if the job is already saved, then either adds or removes it from the `saved_jobs` table. The UI updates based on the response, and a toast notification confirms the action.

### Problem-Solving Questions

**Q: How would you add a new feature like job recommendations?**
A: 
1. Create new API function in `apiJobs.js` to fetch recommended jobs
2. Add database query based on user's saved jobs and applications
3. Create new React component to display recommendations
4. Add route and integrate with existing pages
5. Test with different user scenarios

**Q: How do you ensure data security?**
A: 
- Clerk handles authentication and provides secure JWT tokens
- Supabase enforces row-level security policies
- Environment variables protect sensitive keys
- Input validation prevents SQL injection
- CORS configuration restricts API access

**Q: What would you do if the application was slow?**
A: 
1. **Frontend**: Implement lazy loading, code splitting, memoization
2. **API**: Add pagination, caching, database indexing
3. **Database**: Optimize queries, add indexes on frequently searched columns
4. **Images**: Use CDN, compress images, lazy loading
5. **Monitoring**: Add performance metrics to identify bottlenecks

---

## 🎯 Key Takeaways for Interviews

### What You Built
- A complete job portal with role-based access control
- Modern React frontend with professional UI components
- Secure authentication and authorization system
- RESTful API with proper error handling
- Real-time database with relationship management

### Technologies You Learned
- **React 18**: Modern component patterns, hooks, routing
- **Express.js**: RESTful API design, middleware, authentication
- **Supabase**: Database design, real-time features, security
- **Clerk**: Authentication flows, user management
- **TailwindCSS**: Utility-first styling, responsive design

### Best Practices You Implemented
- **Security**: Authentication, authorization, input validation
- **Code Organization**: Modular structure, reusable components
- **Error Handling**: Try-catch blocks, user feedback
- **State Management**: Local state, custom hooks
- **User Experience**: Loading states, responsive design, accessibility

---

**Remember**: You built a production-ready application with industry-standard practices. Be confident in explaining how each part works together to create a seamless user experience! 🚀
