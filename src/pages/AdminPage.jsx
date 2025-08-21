import React, { useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Admin dashboard for managing users and jobs with full CRUD operations
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Users, Briefcase, Shield, AlertTriangle } from "lucide-react";

// Import reusable admin components
import TableHeaderComponent from "@/components/admin/table-header";
import UserRow from "@/components/admin/user-row";
import JobRow from "@/components/admin/job-row";
import LoadingSpinner from "@/components/admin/loading-spinner";

const AdminPage = () => {
  // State management for users, jobs, and UI controls
  const [users, setUsers] = useState([]);          // All users from Clerk API
  const [searchEmail, setSearchEmail] = useState(""); // Search filter for users
  const [loading, setLoading] = useState(true);    // Loading state for initial user fetch
  
  const [jobs, setJobs] = useState([]);            // All jobs from Supabase
  const [searchJobs, setSearchJobs] = useState(""); // Search filter for jobs
  const [jobsLoading, setJobsLoading] = useState(false); // Loading state for job fetch
  
  const [suspiciousJobs, setSuspiciousJobs] = useState([]); // Suspicious/flagged jobs
  const [cleanedJobs, setCleanedJobs] = useState(new Set()); // Track cleaned jobs in current session
  const [searchSuspicious, setSearchSuspicious] = useState(""); // Search filter for suspicious jobs
  const [suspiciousLoading, setSuspiciousLoading] = useState(false); // Loading state for suspicious jobs
  
  const [error, setError] = useState(null);        // Global error state
  const [activeTab, setActiveTab] = useState("users"); // Current sidebar tab ("users", "jobs", or "suspicious")
  
  const { user, isLoaded } = useUser();            // Current admin user from Clerk
  const { session } = useSession();               // Current session from Clerk
  const { toast } = useToast();                   // Toast notification system

  // Fetch suspicious jobs for admin review
  const fnSuspiciousJobs = async () => {
    try {
      setSuspiciousLoading(true);
      
      const response = await fetch("http://localhost:3001/api/get-suspicious-jobs");
      if (!response.ok) {
        throw new Error(`Failed to fetch suspicious jobs: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter out cleaned jobs from current session
      const filteredData = data.filter(job => !cleanedJobs.has(job.id));
      setSuspiciousJobs(filteredData);
    } catch (err) {
      console.error("❌ Error fetching suspicious jobs:", err);
      setError("Error fetching suspicious jobs");
    } finally {
      setSuspiciousLoading(false);
    }
  };

  // Run auto-detection for suspicious jobs
  const handleAutoDetect = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/auto-detect-suspicious", {
        method: "POST"
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.migrationRequired) {
          toast({
            title: "🔧 Database Migration Required",
            description: "Please run the database migration first. Check SUSPICIOUS_JOBS_MIGRATION.md for instructions.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(result.error || "Auto-detection failed");
      }
      
      toast({
        title: "🔍 Auto-detection complete!",
        description: `${result.flaggedCount} jobs were automatically flagged as suspicious.`,
        variant: "default",
      });
      
      // Refresh jobs lists
      fnJobs();
      fnSuspiciousJobs();
    } catch (err) {
      console.error("Error in auto-detection:", err);
      toast({
        title: "❌ Auto-detection failed",
        description: err.message || "Failed to run auto-detection. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch all jobs with recruiter info via server-side API
  const fnJobs = async () => {
    try {
      setJobsLoading(true);
      
      const response = await fetch("http://localhost:3001/api/jobs");
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error("❌ Error fetching jobs:", err);
      setError("Error fetching jobs");
    } finally {
      setJobsLoading(false);
    }
  };

  // Fetch all platform users from Clerk API via backend
  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Error fetching users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete job permanently via server-side API with service role
  const handleDeleteJob = async (jobId) => {
    try {
      // Verify job exists before deletion
      const checkResponse = await fetch(`http://localhost:3001/api/jobs`);
      const serverJobs = await checkResponse.json();
      
      const jobExists = serverJobs.find(job => job.id == jobId);
      if (!jobExists) {
        console.error("❌ Job not found on server side");
        toast({
          title: "❌ Job not found",
          description: `Job ID ${jobId} not found in database. The job list might be out of sync.`,
          variant: "destructive",
        });
        fnJobs();
        return;
      }
      
      // Delete via server-side API (bypasses RLS)
      const response = await fetch(`http://localhost:3001/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server deletion failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh both regular jobs and suspicious jobs
      fnJobs();
      fnSuspiciousJobs();
      
      toast({
        title: "✅ Job deleted successfully!",
        description: `"${jobExists.title}" has been removed from the platform. (${result.rowsAffected} row affected)`,
        variant: "default",
      });    } catch (err) {
      console.error("❌ Error deleting job:", err);
      toast({
        title: "❌ Error deleting job",
        description: err.message || "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Clean/unflag job from suspicious list
  const handleCleanJob = async (jobId) => {
    try {
      // Add job to cleaned list for current session
      const updatedCleanedJobs = new Set([...cleanedJobs, jobId]);
      setCleanedJobs(updatedCleanedJobs);
      
      toast({
        title: "✅ Job cleaned successfully!",
        description: "The job has been cleared from suspicious jobs list for this session.",
        variant: "default",
      });
      
      // Immediately update the suspicious jobs list by filtering out the cleaned job
      setSuspiciousJobs(prev => prev.filter(job => job.id !== jobId));
      
    } catch (err) {
      console.error("Error cleaning job:", err);
      toast({
        title: "❌ Error cleaning job",
        description: err.message || "Failed to clean job. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete user permanently from Clerk via server-side API
  const handleDeleteUser = async (userId) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      const userEmail = userToDelete?.email_addresses?.[0]?.email_address || "Unknown";
      
      const res = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      // Update local state for immediate UI feedback
      setUsers(users.filter((user) => user.id !== userId));
      
      toast({
        title: "🗑️ User deleted successfully!",
        description: `User ${userEmail} has been permanently removed from the platform.`,
        variant: "default",
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({
        title: "❌ Error deleting user",
        description: err.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Toggle user ban status via Clerk API through server
  const handleBanUser = async (userId, currentBannedStatus) => {
    try {
      const action = currentBannedStatus ? "unban" : "ban";
      const userToBan = users.find(u => u.id === userId);
      const userEmail = userToBan?.email_addresses?.[0]?.email_address || "Unknown";
      
      const res = await fetch(`http://localhost:3001/api/${action}-user/${userId}`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to ${action} user:`, errorText);
        throw new Error(`Failed to ${action} user: ${res.status}`);
      }

      // Update user's ban status in local state for immediate UI feedback
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, banned: !currentBannedStatus }
          : user
      ));
      
      toast({
        title: currentBannedStatus ? "✅ User unbanned successfully!" : "🚫 User banned successfully!",
        description: currentBannedStatus 
          ? `${userEmail} has been unbanned and can access the platform again.`
          : `${userEmail} has been banned from the platform.`,
        variant: "default",
      });
      
    } catch (err) {
      console.error("Error banning/unbanning user:", err);
      toast({
        title: `❌ Error ${currentBannedStatus ? 'unbanning' : 'banning'} user`,
        description: err.message || `Failed to ${currentBannedStatus ? 'unban' : 'ban'} user. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Load jobs when jobs tab is active and user is authenticated
  useEffect(() => {
    if (activeTab === "jobs" && isLoaded) {
      fnJobs();
    }
  }, [activeTab, isLoaded]);

  // Load suspicious jobs when suspicious tab is active
  useEffect(() => {
    if (activeTab === "suspicious" && isLoaded) {
      fnSuspiciousJobs();
    }
  }, [activeTab, isLoaded]);

  // Filter users (exclude admins) and apply search filter
  const filteredUsers = users.filter((user) => {
    const email = user.email_addresses?.[0]?.email_address || "";
    const name = user.first_name || "";
    const username = user.username || "";
    return (
      !email.endsWith("@admin.com") &&
      (email.toLowerCase().includes(searchEmail.toLowerCase()) ||
       name.toLowerCase().includes(searchEmail.toLowerCase()) ||
       username.toLowerCase().includes(searchEmail.toLowerCase()))
    );
  });

  // Filter jobs by title or recruiter email
  const filteredJobs = (jobs || []).filter((job) => {
    const title = job.title || "";
    const recruiterEmail = job.recruiter_email || "";
    return (
      title.toLowerCase().includes(searchJobs.toLowerCase()) ||
      recruiterEmail.toLowerCase().includes(searchJobs.toLowerCase())
    );
  });

  // Filter suspicious jobs by title or recruiter email
  const filteredSuspiciousJobs = (suspiciousJobs || []).filter((job) => {
    const title = job.title || "";
    const recruiterEmail = job.recruiter_email || "";
    const reason = job.suspicious_reason || "";
    return (
      title.toLowerCase().includes(searchSuspicious.toLowerCase()) ||
      recruiterEmail.toLowerCase().includes(searchSuspicious.toLowerCase()) ||
      reason.toLowerCase().includes(searchSuspicious.toLowerCase())
    );
  });

  // Show loading or error states
  if (loading) return <LoadingSpinner message="Loading users..." />;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // Render main table component based on active tab
  const renderTableContent = () => {
    const tableConfig = {
      users: {
        title: "All Users",
        searchPlaceholder: "Search by email or name...",
        searchValue: searchEmail,
        onSearchChange: setSearchEmail,
        data: filteredUsers,
        totalCount: filteredUsers.length,
        loading: loading,
        loadingMessage: "Loading users...",
        emptyMessage: searchEmail ? "No users found matching your search." : "No users found.",
        headers: ["Name", "Email", "Username", "Role", "Status", "Last Signed In", "Created", "Actions"],
        renderRow: (user) => (
          <UserRow 
            key={user.id} 
            user={user} 
            onBanUser={handleBanUser} 
            onDeleteUser={handleDeleteUser} 
          />
        )
      },
      jobs: {
        title: "All Jobs",
        searchPlaceholder: "Search by title or recruiter email...",
        searchValue: searchJobs,
        onSearchChange: setSearchJobs,
        data: filteredJobs,
        totalCount: filteredJobs.length,
        loading: jobsLoading,
        loadingMessage: "Loading jobs...",
        emptyMessage: searchJobs ? "No jobs found matching your search." : "No jobs posted yet.",
        headers: ["Title", "Recruiter Email", "Location", "Status", "Created", "Actions"],
        renderRow: (job) => (
          <JobRow 
            key={job.id} 
            job={job} 
            onDeleteJob={handleDeleteJob} 
          />
        )
      },
      suspicious: {
        title: "Flagged Jobs",
        searchPlaceholder: "Search by title, recruiter, or reason...",
        searchValue: searchSuspicious,
        onSearchChange: setSearchSuspicious,
        data: filteredSuspiciousJobs,
        totalCount: filteredSuspiciousJobs.length,
        loading: suspiciousLoading,
        loadingMessage: "Loading suspicious jobs...",
        emptyMessage: searchSuspicious ? "No suspicious jobs found matching your search." : "No suspicious jobs flagged yet. 🎉",
        headers: ["Title", "Recruiter Email", "Suspicious Reason", "Location", "Flagged Date", "Actions"],
        renderRow: (job) => (
          <JobRow 
            key={job.id} 
            job={job} 
            onDeleteJob={handleDeleteJob}
            onCleanJob={handleCleanJob}
            showSuspiciousReason={true}
          />
        ),
        headerActions: (
          <Button 
            onClick={handleAutoDetect}
            variant="outline"
            className="bg-orange-600 hover:bg-orange-700 text-white border-orange-500"
          >
            Auto-Detect Suspicious
          </Button>
        )
      }
    };

    const config = tableConfig[activeTab];
    if (!config) return null;

    return (
      <div className={`bg-transparent/5 backdrop-blur-sm rounded-xl border ${
        activeTab === 'suspicious' ? 'border-orange-600/30' : 'border-gray-600/30'
      } shadow-sm`}>
        <TableHeaderComponent
          title={config.title}
          searchValue={config.searchValue}
          onSearchChange={config.onSearchChange}
          searchPlaceholder={config.searchPlaceholder}
          totalCount={config.totalCount}
        >
          {config.headerActions}
        </TableHeaderComponent>

        {config.loading ? (
          <LoadingSpinner message={config.loadingMessage} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-transparent">
                <TableRow>
                  {config.headers.map((header) => (
                    <TableHead key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {config.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={config.headers.length} className="px-6 py-8 text-center text-gray-400">
                      {config.emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  config.data.map(config.renderRow)
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        {/* Admin navigation sidebar */}
        <Sidebar className="w-72 border-r border-gray-600/30 bg-transparent/10 backdrop-blur-sm">
          <SidebarHeader className="p-6 border-b border-gray-600/20 bg-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Admin Panel</h2>
                <p className="text-sm text-gray-300">HIRED Management</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                Main Navigation
              </h3>
              <SidebarMenu className="space-y-2">
                {/* Users tab navigation */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "users"}
                    onClick={() => setActiveTab("users")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === "users" 
                        ? "bg-blue-600/20 text-blue-300 border border-blue-400/30 shadow-sm" 
                        : "text-gray-300 hover:bg-gray-700/20 hover:text-white"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Users</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* Jobs tab navigation */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "jobs"}
                    onClick={() => setActiveTab("jobs")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === "jobs" 
                        ? "bg-blue-600/20 text-blue-300 border border-blue-400/30 shadow-sm" 
                        : "text-gray-300 hover:bg-gray-700/20 hover:text-white"
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                    <span className="font-medium">Jobs</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* Suspicious Jobs tab navigation */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeTab === "suspicious"}
                    onClick={() => setActiveTab("suspicious")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === "suspicious" 
                        ? "bg-orange-600/20 text-orange-300 border border-orange-400/30 shadow-sm" 
                        : "text-gray-300 hover:bg-gray-700/20 hover:text-white"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Suspicious Jobs</span>
                    {suspiciousJobs.length > 0 && (
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full ml-auto">
                        {suspiciousJobs.length}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main content area */}
        <div className="flex-1 p-8">
          {/* Section header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {activeTab === 'users' && 'User Management'}
                  {activeTab === 'jobs' && 'Jobs Management'}
                  {activeTab === 'suspicious' && 'Suspicious Jobs'}
                </h1>
                <p className="text-gray-300">
                  {activeTab === 'users' && 'Manage all users on the platform'}
                  {activeTab === 'jobs' && 'Manage all job postings on the platform'}
                  {activeTab === 'suspicious' && 'Review and manage flagged job postings'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-transparent px-4 py-2 rounded-lg border border-gray-600/30 shadow-sm">
                  <span className="text-sm text-gray-300">
                    {activeTab === 'users' && 'Total Users: '}
                    {activeTab === 'jobs' && 'Total Jobs: '}
                    {activeTab === 'suspicious' && 'Flagged Jobs: '}
                  </span>
                  <span className={`font-semibold ${activeTab === 'suspicious' ? 'text-orange-300' : 'text-white'}`}>
                    {activeTab === 'users' && filteredUsers.length}
                    {activeTab === 'jobs' && filteredJobs.length}
                    {activeTab === 'suspicious' && filteredSuspiciousJobs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Render appropriate table */}
          {renderTableContent()}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminPage;
