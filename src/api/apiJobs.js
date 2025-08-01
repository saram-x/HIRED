import supabaseClient from "@/utils/supabase";

/**
 * JOB MANAGEMENT API
 * This file contains all job-related API functions for the HIRED platform
 * All functions require a Clerk session token for authentication
 */

// Fetch Jobs with filters
// Used in: JobListing page, AdminPanel
export async function getJobs(token, { location, company_id, searchQuery }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select("*, saved: saved_jobs(id), company: companies(name,logo_url)");

  if (location) {
    query = query.eq("location", location);
  }

  if (company_id) {
    query = query.eq("company_id", company_id);
  }

  if (searchQuery) {
    query = query.ilike("title", `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

// Read Saved Jobs for current user
// Used in: SavedJobs page
export async function getSavedJobs(token) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*, job: jobs(*, company: companies(name,logo_url))");

  if (error) {
    console.error("Error fetching Saved Jobs:", error);
    return null;
  }

  return data;
}

// Read single job with company and applications data
// Used in: Job detail page
export async function getSingleJob(token, { job_id }) {
  const supabase = await supabaseClient(token);
  let query = supabase
    .from("jobs")
    .select(
      "*, company: companies(name,logo_url), applications: applications(*)"
    )
    .eq("id", job_id)
    .single();

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching Job:", error);
    return null;
  }

  return data;
}

// Add or Remove job from saved jobs (toggle functionality)
// Used in: JobCard component heart button
export async function saveJob(token, _, saveData) {
  const supabase = await supabaseClient(token);

  // Check if job is already saved by this user
  const { data: existingSaves, error: checkError } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_id", saveData.user_id)
    .eq("job_id", saveData.job_id);

  if (checkError) {
    console.error("❌ Error checking existing saved job:", checkError);
    throw checkError;
  }

  if (existingSaves && existingSaves.length > 0) {
    // If the job is already saved, remove it
    const { data, error: deleteError } = await supabase
      .from("saved_jobs")
      .delete()
      .eq("job_id", saveData.job_id)
      .eq("user_id", saveData.user_id);

    if (deleteError) {
      console.error("❌ Error removing saved job:", deleteError);
      throw deleteError;
    }

    return []; // Return empty array to indicate job is no longer saved
  } else {
    // If the job is not saved, add it to saved jobs
    const { data, error: insertError } = await supabase
      .from("saved_jobs")
      .insert([{
        user_id: saveData.user_id,
        job_id: saveData.job_id
      }])
      .select();

    if (insertError) {
      console.error("❌ Error saving job:", insertError);
      throw insertError;
    }

    return data; // Return the saved job data
  }
}

// Toggle job hiring status (Open/Closed) - Only for recruiters
// Used in: Job detail page, MyJobs page  
export async function updateHiringStatus(token, { job_id }, isOpen) {
  const supabase = await supabaseClient(token);
  const { data, error } = await supabase
    .from("jobs")
    .update({ isOpen })
    .eq("id", job_id)
    .select();

  if (error) {
    console.error("Error Updating Hiring Status:", error);
    return null;
  }

  return data;
}

// Get jobs created by current recruiter
// Used in: CreatedJobs component (MyJobs page for recruiters)
export async function getMyJobs(token, { recruiter_id }) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .select("*, company: companies(name,logo_url)")
    .eq("recruiter_id", recruiter_id);

  if (error) {
    console.error("Error fetching Jobs:", error);
    return null;
  }

  return data;
}

// Delete job (with comprehensive error handling)
// Used in: JobCard component, AdminPanel
export async function deleteJob(token, { job_id }) {
  const supabase = await supabaseClient(token);

  // First, let's check if the job exists
  const { data: existingJob, error: fetchError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", job_id)
    .single();

  if (fetchError) {
    throw new Error(`Job not found: ${fetchError.message}`);
  }

  const { data, error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("id", job_id)
    .select();

  if (deleteError) {
    throw new Error(`Failed to delete job: ${deleteError.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Job was not deleted - check permissions");
  }

  return data;
}

// Create new job posting
// Used in: PostJob page
export async function addNewJob(token, _, jobData) {
  const supabase = await supabaseClient(token);

  const { data, error } = await supabase
    .from("jobs")
    .insert([jobData])
    .select();

  if (error) {
    console.error(error);
    throw new Error("Error Creating Job");
  }

  return data;
}