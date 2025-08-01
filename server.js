/**
 * ===============================================
 * HIRED PLATFORM - ADMIN BACKEND SERVER
 * ===============================================
 * 
 * PURPOSE:
 * Express.js server providing administrative API endpoints for the HIRED job portal.
 * This server operates with elevated privileges to manage users and jobs across the platform.
 * 
 * KEY FEATURES:
 * 1. User Management via Clerk API
 * 2. Job Management via Supabase with service role
 * 3. Bypasses Row Level Security (RLS) for admin operations
 * 4. Integrates with both Clerk and Supabase services
 * 
 * ARCHITECTURE:
 * - Port: 3001 (separate from main frontend)
 * - CORS enabled for frontend communication
 * - Uses service role key for unrestricted database access
 * - Leverages Clerk secret key for user management
 * 
 * SECURITY CONSIDERATIONS:
 * - Service role key bypasses all RLS policies
 * - Clerk secret key provides full user management access
 * - Should only be accessible by authenticated admins
 * - All operations include comprehensive error handling
 * 
 * API ENDPOINTS:
 * USER MANAGEMENT:
 * - GET /api/get-clerk-users - Fetch all users
 * - DELETE /api/delete-user/:userId - Delete user
 * - POST /api/ban-user/:userId - Ban user
 * - POST /api/unban-user/:userId - Unban user
 * 
 * JOB MANAGEMENT:
 * - GET /api/get-jobs - Fetch all jobs with recruiter info
 * - DELETE /api/delete-job/:jobId - Delete job
 * 
 * TESTING:
 * - GET /api/test-supabase - Test database connection
 */

import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();
const port = 3001;

// ===============================================
// SUPABASE CONFIGURATION
// ===============================================

/**
 * SUPABASE CLIENT INITIALIZATION
 * 
 * Critical Configuration:
 * - Uses SERVICE_ROLE_KEY instead of ANON_KEY for admin operations
 * - Service role bypasses ALL Row Level Security (RLS) policies
 * - Enables unrestricted read/write access to all tables
 * - autoRefreshToken: false - No token refresh needed for service role
 * - persistSession: false - No session persistence needed for server operations
 * 
 * Security Notes:
 * - Service role key should NEVER be exposed to frontend
 * - Fallback to ANON_KEY for development/testing only
 * - In production, SERVICE_ROLE_KEY must be set in environment
 */
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log("🔑 Supabase initialized with key:", (process.env.SUPABASE_SERVICE_ROLE_KEY ? "SERVICE_ROLE" : "ANON_KEY"));

// ===============================================
// MIDDLEWARE CONFIGURATION
// ===============================================

/**
 * CORS Configuration: Enables cross-origin requests from frontend
 * JSON Parser: Handles incoming JSON payloads
 */
app.use(cors());
app.use(express.json());

// ===============================================
// CLERK USER MANAGEMENT ENDPOINTS
// ===============================================

/**
 * GET ALL USERS ENDPOINT
 * 
 * Purpose: Retrieves complete user list from Clerk for admin management
 * Method: GET /api/get-clerk-users
 * 
 * Authentication: Uses Clerk secret key for API access
 * Returns: Array of user objects with full profile data
 * 
 * User Data Includes:
 * - Basic info: first_name, email_addresses, username
 * - Account status: banned, verified, created_at, last_sign_in_at
 * - Metadata: role (from unsafe_metadata or public_metadata)
 * 
 * Frontend Usage: Admin panel user table population
 */
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
    console.error("Error fetching Clerk users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * DELETE USER ENDPOINT
 * 
 * Purpose: Permanently removes a user from the platform
 * Method: DELETE /api/delete-user/:userId
 * Parameters: userId (Clerk user ID from URL path)
 * 
 * Process:
 * 1. Extracts user ID from request parameters
 * 2. Makes DELETE request to Clerk API
 * 3. Uses Clerk secret key for authentication
 * 4. Returns success/error response
 * 
 * Security: Requires valid Clerk secret key
 * Effects: User is permanently deleted from Clerk (irreversible)
 * Frontend Usage: Admin panel user deletion
 */
app.delete("/api/delete-user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.VITE_CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Clerk error:", errData);
      return res.status(500).json({ error: "Clerk deletion failed", details: errData });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Server error deleting user:", error);
    res.status(500).json({ error: "Server error deleting user" });
  }
});

/**
 * BAN USER ENDPOINT
 * 
 * Purpose: Prevents user from accessing the platform (non-destructive)
 * Method: POST /api/ban-user/:userId
 * Parameters: userId (Clerk user ID from URL path)
 * 
 * Process:
 * 1. Makes POST request to Clerk ban endpoint
 * 2. User account remains but access is blocked
 * 3. User cannot sign in while banned
 * 
 * Benefits over deletion:
 * - Reversible action (can be unbanned)
 * - Preserves user data and history
 * - Maintains referential integrity in database
 * 
 * Frontend Usage: Admin panel user management
 */
app.post("/api/ban-user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/ban`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VITE_CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Clerk ban error:", errData);
      return res.status(500).json({ error: "Clerk ban failed", details: errData });
    }

    res.status(200).json({ message: "User banned successfully" });
  } catch (error) {
    console.error("Server error banning user:", error);
    res.status(500).json({ error: "Server error banning user" });
  }
});

/**
 * UNBAN USER ENDPOINT
 * 
 * Purpose: Restores user access to the platform
 * Method: POST /api/unban-user/:userId
 * Parameters: userId (Clerk user ID from URL path)
 * 
 * Process:
 * 1. Makes POST request to Clerk unban endpoint
 * 2. Removes ban status from user account
 * 3. User can sign in again immediately
 * 
 * Frontend Usage: Admin panel user management
 */
app.post("/api/unban-user/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const response = await fetch(`https://api.clerk.com/v1/users/${userId}/unban`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.VITE_CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Clerk unban error:", errData);
      return res.status(500).json({ error: "Clerk unban failed", details: errData });
    }

    res.status(200).json({ message: "User unbanned successfully" });
  } catch (error) {
    console.error("Server error unbanning user:", error);
    res.status(500).json({ error: "Server error unbanning user" });
  }
});

// ===============================================
// JOB MANAGEMENT ENDPOINTS
// ===============================================

/**
 * GET ALL JOBS ENDPOINT
 * 
 * Purpose: Retrieves all job postings with enriched recruiter information
 * Method: GET /api/get-jobs
 * 
 * Process Flow:
 * 1. Query Supabase jobs table with service role (bypasses RLS)
 * 2. For each job, fetch recruiter details from Clerk API
 * 3. Combine job data with recruiter information
 * 4. Return enriched job objects
 * 
 * Why Service Role:
 * - Bypasses Row Level Security policies
 * - Accesses all jobs regardless of ownership
 * - Required for admin-level operations
 * 
 * Data Enrichment:
 * - Adds recruiter_email from Clerk
 * - Adds recruiter_name from Clerk
 * - Handles missing/invalid recruiter IDs gracefully
 * 
 * Response Format:
 * - Array of job objects with recruiter info
 * - Fallback values ("N/A") for missing data
 * - Ordered by creation date (newest first)
 * 
 * Frontend Usage: Admin panel job table population
 */
app.get("/api/get-jobs", async (req, res) => {
  try {
    console.log("📝 Fetching jobs from Supabase...");
    console.log("Supabase URL:", process.env.VITE_SUPABASE_URL);
    console.log("Using key type:", (process.env.SUPABASE_SERVICE_ROLE_KEY ? "SERVICE_ROLE" : "ANON_KEY"));
    
    // Try to get jobs with RLS bypass if service role is available
    let query = supabase.from("jobs").select("*");
    
    // If we have service role, we can bypass RLS
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("🔓 Using service role - RLS bypassed");
    } else {
      console.log("⚠️ Using anon key - RLS policies apply");
    }
    
    const { data: jobs, error } = await query.order("created_at", { ascending: false });

    console.log("📊 Supabase response:", { jobs: jobs?.length, error });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: "Failed to fetch jobs", details: error });
    }

    if (!jobs || jobs.length === 0) {
      console.log("ℹ️ No jobs found in database");
      return res.status(200).json([]);
    }

    console.log(`✅ Found ${jobs.length} jobs, fetching recruiter details...`);

    // Get recruiter details from Clerk for each job
    const jobsWithRecruiters = await Promise.all(
      jobs.map(async (job) => {
        try {
          const response = await fetch(`https://api.clerk.com/v1/users/${job.recruiter_id}`, {
            headers: {
              Authorization: `Bearer ${process.env.VITE_CLERK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const recruiter = await response.json();
            return {
              ...job,
              recruiter_email: recruiter.email_addresses?.[0]?.email_address || "N/A",
              recruiter_name: recruiter.first_name || "N/A",
              companies: { name: "N/A" } // Placeholder for now
            };
          } else {
            console.log(`⚠️ Failed to fetch recruiter ${job.recruiter_id}`);
            return {
              ...job,
              recruiter_email: "N/A",
              recruiter_name: "N/A",
              companies: { name: "N/A" }
            };
          }
        } catch (err) {
          console.error(`Error fetching recruiter ${job.recruiter_id}:`, err);
          return {
            ...job,
            recruiter_email: "N/A",
            recruiter_name: "N/A",
            companies: { name: "N/A" }
          };
        }
      })
    );

    console.log(`✅ Returning ${jobsWithRecruiters.length} jobs with recruiter details`);
    res.status(200).json(jobsWithRecruiters);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs", details: error.message });
  }
});

/**
 * SUPABASE CONNECTION TEST ENDPOINT
 * 
 * Purpose: Diagnostic endpoint to verify database connectivity
 * Method: GET /api/test-supabase
 * 
 * Test Process:
 * 1. Attempts to query jobs table for count
 * 2. Verifies environment variables are loaded
 * 3. Tests both service role and anonymous key access
 * 
 * Usage: Debugging connection issues during development
 * Returns: Connection status and job count
 */
app.get("/api/test-supabase", async (req, res) => {
  try {
    console.log("🔍 Testing Supabase connection...");
    console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
    console.log("VITE_SUPABASE_ANON_KEY:", process.env.VITE_SUPABASE_ANON_KEY ? "EXISTS" : "MISSING");
    
    const { data, error } = await supabase
      .from("jobs")
      .select("count", { count: "exact", head: true });
      
    if (error) {
      console.error("❌ Supabase test error:", error);
      return res.status(500).json({ error: "Supabase connection failed", details: error });
    }
    
    console.log("✅ Supabase test successful, jobs count:", data);
    res.status(200).json({ message: "Supabase connected successfully", count: data });
  } catch (error) {
    console.error("❌ Test error:", error);
    res.status(500).json({ error: "Test failed", details: error.message });
  }
});

/**
 * DELETE JOB ENDPOINT
 * 
 * Purpose: Permanently removes a job posting from the platform
 * Method: DELETE /api/delete-job/:jobId
 * Parameters: jobId (Supabase job ID from URL path)
 * 
 * Security Features:
 * - Uses service role to bypass RLS policies
 * - Verifies job exists before attempting deletion
 * - Returns deleted job data for confirmation
 * 
 * Process Flow:
 * 1. Extract job ID from URL parameters
 * 2. Verify job exists in database (prevents false positives)
 * 3. Perform deletion with service role privileges
 * 4. Return confirmation with affected row count
 * 
 * Response Data:
 * - Success: Deleted job object + row count
 * - Error: Detailed error message for debugging
 * 
 * Frontend Usage: Admin panel job deletion
 * Effects: Job is permanently removed (irreversible)
 */
app.delete("/api/delete-job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    console.log(`🗑️ Attempting to delete job with ID: ${jobId}`);

    // STEP 1: Verify job exists before deletion attempt
    // This prevents misleading "success" responses for non-existent jobs
    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (fetchError) {
      console.error("❌ Job not found:", fetchError);
      return res.status(404).json({ error: "Job not found" });
    }

    console.log("📋 Job to be deleted:", existingJob);

    // STEP 2: Perform deletion and return deleted data for confirmation
    // Using .select() returns the deleted row data for verification
    const { data, error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId)
      .select();

    if (error) {
      console.error("❌ Supabase delete error:", error);
      return res.status(500).json({ error: "Failed to delete job" });
    }

    console.log("✅ Job deleted successfully:", data);
    console.log("📊 Number of rows affected:", data?.length || 0);

    // STEP 3: Validate deletion was successful
    // Extra safety check to ensure the operation actually affected rows
    if (!data || data.length === 0) {
      console.warn("⚠️ No rows were deleted - unexpected behavior");
      return res.status(500).json({ error: "Job deletion failed - no rows affected" });
    }

    // STEP 4: Return success response with deletion confirmation
    res.status(200).json({ 
      message: "Job deleted successfully", 
      deletedJob: data[0],          // The actual deleted job data
      rowsAffected: data.length     // Number of rows affected (should be 1)
    });
  } catch (error) {
    console.error("❌ Server error deleting job:", error);
    res.status(500).json({ error: "Server error deleting job" });
  }
});

// ===============================================
// SERVER STARTUP
// ===============================================

/**
 * START EXPRESS SERVER
 * 
 * Starts the admin backend server on the specified port
 * Provides confirmation message with server URL
 * 
 * Default Port: 3001 (separate from main frontend)
 * Environment: Can be overridden via PORT environment variable
 */
app.listen(port, () => {
  console.log(`✅ Backend server running on http://localhost:${port}`);
});