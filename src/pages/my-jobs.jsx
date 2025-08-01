import CreatedApplications from "@/components/created-applications";
import CreatedJobs from "@/components/created-jobs";
import { useUser } from "@clerk/clerk-react";
import { BarLoader } from "react-spinners";

/**
 * MY JOBS PAGE COMPONENT
 * Role-specific dashboard for users on the HIRED platform
 * 
 * Features:
 * - Dynamic content based on user role
 * - Candidates: View their job applications
 * - Recruiters: Manage their posted jobs
 * - Loading state while fetching user data
 * 
 * Components Used:
 * - CreatedApplications: Shows candidate's applications
 * - CreatedJobs: Shows recruiter's posted jobs
 */
const MyJobs = () => {
  const { user, isLoaded } = useUser();

  // Show loading spinner while user data is being fetched
  if (!isLoaded) {
    return <BarLoader className="mb-4" width={"100%"} color="#36d7b7" />;
  }

  return (
    <div>
      {/* Dynamic title based on user role */}
      <h1 className="gradient-title font-extrabold text-5xl sm:text-7xl text-center pb-8">
        {user?.unsafeMetadata?.role === "candidate"
          ? "My Applications"
          : "My Jobs"}
      </h1>
      
      {/* Role-specific content rendering */}
      {user?.unsafeMetadata?.role === "candidate" ? (
        <CreatedApplications />
      ) : (
        <CreatedJobs />
      )}
    </div>
  );
};

export default MyJobs;