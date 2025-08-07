import React, { useEffect, useState } from "react";
import { useUser, useSession } from "@clerk/clerk-react";
import { deleteJob } from "@/api/apiJobs";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
import { Input } from "@/components/ui/input";
import { Users, Briefcase, Shield } from "lucide-react";

const AdminPageSimple = () => {
  // State management for users, jobs, and UI controls
  const [users, setUsers] = useState([]);          // All users from Clerk API
  const [searchEmail, setSearchEmail] = useState(""); // Search filter for users
  const [loading, setLoading] = useState(true);    // Loading state for initial user fetch
  
  const [jobs, setJobs] = useState([]);            // All jobs from Supabase
  const [searchJobs, setSearchJobs] = useState(""); // Search filter for jobs
  const [jobsLoading, setJobsLoading] = useState(false); // Loading state for job fetch
  
  const [error, setError] = useState(null);        // Global error state
  const [activeTab, setActiveTab] = useState("users"); // Current sidebar tab ("users" or "jobs")
  
  const { user, isLoaded } = useUser();            // Current admin user from Clerk
  const { session } = useSession();               // Current session from Clerk
  const { toast } = useToast();                   // Toast notification system

  // Fetch all jobs with recruiter info via server-side API
  const fnJobs = async () => {
    try {
      setJobsLoading(true);
      console.log("📡 Fetching jobs for admin...");
      
      const response = await fetch("http://localhost:3001/api/get-jobs");
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Jobs fetched successfully:", data);
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
      const res = await fetch("http://localhost:3001/api/get-clerk-users");
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
      console.log("🗑️ Admin deleting job with ID:", jobId);
      
      // Verify job exists before deletion
      const checkResponse = await fetch(`http://localhost:3001/api/get-jobs`);
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
      
      console.log("✅ Job found on server, proceeding with deletion...");
      
      // Delete via server-side API (bypasses RLS)
      const response = await fetch(`http://localhost:3001/api/delete-job/${jobId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server deletion failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ Server-side deletion successful:", result);
      
      fnJobs();
      
      toast({
        title: "✅ Job deleted successfully!",
        description: `"${jobExists.title}" has been removed from the platform. (${result.rowsAffected} row affected)`,
        variant: "default",
      });
      
    } catch (err) {
      console.error("❌ Error deleting job:", err);
      toast({
        title: "❌ Error deleting job",
        description: err.message || "Failed to delete job. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete user permanently from Clerk via server-side API
  const handleDeleteUser = async (userId) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      const userEmail = userToDelete?.email_addresses?.[0]?.email_address || "Unknown";
      
      const res = await fetch(`http://localhost:3001/api/delete-user/${userId}`, {
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
      console.log("🔍 Fetching jobs for admin...");
      fnJobs();
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

  // Show loading or error states
  if (loading) return <div className="p-6">Loading users...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

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
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>

        {/* Main content area */}
        <div className="flex-1 p-8">
          {activeTab === "users" ? (
            <>
              {/* User management section header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-300">Manage all users on the platform</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-transparent px-4 py-2 rounded-lg border border-gray-600/30 shadow-sm">
                      <span className="text-sm text-gray-300">Total Users: </span>
                      <span className="font-semibold text-white">{filteredUsers.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User table loading state */}
              {loading ? (
                <div className="text-center py-20">
                  <div className="text-white">Loading users...</div>
                </div>
              ) : (
                <div className="bg-transparent/5 backdrop-blur-sm rounded-xl border border-gray-600/30 shadow-sm">
                  {/* User table header with search */}
                  <div className="p-6 border-b border-gray-600/20 bg-transparent">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">All Users</h2>
                      <Input
                        placeholder="Search by email or name..."
                        className="max-w-sm bg-transparent/10 border-gray-600/30 text-white placeholder:text-gray-400"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Users data table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Signed In</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* No users found state */}
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="px-6 py-8 text-center text-gray-400">
                              {searchEmail ? "No users found matching your search." : "No users found."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          // User rows with data and action buttons
                          filteredUsers.map((user) => {
                            const name = user.first_name || "No name";
                            const email = user.email_addresses?.[0]?.email_address || "No email";
                            const username = user.username || "-";
                            const role = user.unsafe_metadata?.role || user.public_metadata?.role || "N/A";
                            const status = user.email_addresses?.[0]?.verification?.status || "Not Verified";
                            const lastSignIn = user.last_sign_in_at
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : "-";
                            const createdAt = user.created_at
                              ? new Date(user.created_at).toLocaleDateString()
                              : "-";

                            return (
                              <TableRow key={user.id}>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200 font-medium">{name}</TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200">{email}</TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200">{username}</TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap capitalize text-gray-200">{role}</TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    user.banned 
                                      ? "bg-red-100 text-red-800" 
                                      : "bg-green-100 text-green-800"
                                  }`}>
                                    {user.banned ? "Banned" : "Active"}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200">{lastSignIn}</TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200">{createdAt}</TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap">
                                  <div className="flex gap-2">
                                    {/* Ban/Unban user button with confirmation */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button
                                          className={`px-3 py-1 rounded text-xs font-medium ${
                                            user.banned 
                                              ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                              : "bg-red-100 text-red-700 hover:bg-red-200"
                                          }`}
                                        >
                                          {user.banned ? "Unban" : "Ban"}
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            {user.banned ? "Unban User" : "Ban User"}
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to {user.banned ? "unban" : "ban"} {email}?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleBanUser(user.id, user.banned)}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            Confirm {user.banned ? "Unban" : "Ban"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>

                                    {/* Delete user button with confirmation */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200">
                                          Delete
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete {email}? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white"
                                          >
                                            Confirm Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Jobs management section header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Jobs Management</h1>
                    <p className="text-gray-300">Manage all job postings on the platform</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-transparent px-4 py-2 rounded-lg border border-gray-600/30 shadow-sm">
                      <span className="text-sm text-gray-300">Total Jobs: </span>
                      <span className="font-semibold text-white">{filteredJobs.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Jobs table loading state */}
              {jobsLoading ? (
                <div className="text-center py-20">
                  <div className="text-white">Loading jobs...</div>
                </div>
              ) : (
                <div className="bg-transparent/5 backdrop-blur-sm rounded-xl border border-gray-600/30 shadow-sm">
                  {/* Jobs table header with search */}
                  <div className="p-6 border-b border-gray-600/20 bg-transparent">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-white">All Jobs</h2>
                      <Input
                        placeholder="Search by title or recruiter email..."
                        className="max-w-sm bg-transparent/10 border-gray-600/30 text-white placeholder:text-gray-400"
                        value={searchJobs}
                        onChange={(e) => setSearchJobs(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Jobs data table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-transparent">
                        <TableRow>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Recruiter Email</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</TableHead>
                          <TableHead className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* No jobs found state */}
                        {filteredJobs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="px-6 py-8 text-center text-gray-400">
                              {searchJobs ? "No jobs found matching your search." : "No jobs posted yet."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          // Job rows with data and delete action
                          filteredJobs.map((job) => {
                            const createdAt = job.created_at
                              ? new Date(job.created_at).toLocaleDateString()
                              : "-";

                            return (
                              <TableRow key={job.id}>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200 font-medium">
                                  {job.title || "No title"}
                                </TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200">
                                  {job.recruiter_email || "N/A"}
                                </TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200">
                                  {job.location || "Remote"}
                                </TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    job.isOpen 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {job.isOpen ? "Open" : "Closed"}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap text-gray-200">
                                  {createdAt}
                                </TableCell>
                                <TableCell className="px-6 py-3 whitespace-nowrap">
                                  {/* Delete job button with confirmation */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <button className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200">
                                        Delete
                                      </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Job</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{job.title}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteJob(job.id)}
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                        >
                                          Confirm Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminPageSimple;
