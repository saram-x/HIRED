import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env file
dotenv.config();
const app = express();
const port = 3001;

// Initialize Supabase client with service role for admin operations
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

// Enable CORS and JSON parsing middleware
app.use(cors());
app.use(express.json());

// Get all users from Clerk API for admin management
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

// Delete user permanently from Clerk
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

// Ban user from accessing the platform
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

// Unban user to restore platform access
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

// Get all jobs with recruiter information for admin panel
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

// Test Supabase connection and return job count for diagnostics
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

// Delete job permanently from database using service role
app.delete("/api/delete-job/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    console.log(`🗑️ Attempting to delete job with ID: ${jobId}`);

    // Verify job exists before deletion attempt
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

    // Perform deletion and return deleted data for confirmation
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

    // Validate deletion was successful
    if (!data || data.length === 0) {
      console.warn("⚠️ No rows were deleted - unexpected behavior");
      return res.status(500).json({ error: "Job deletion failed - no rows affected" });
    }

    // Return success response with deletion confirmation
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

// Start Express server on specified port
app.listen(port, () => {
  console.log(`✅ Backend server running on http://localhost:${port}`);
});