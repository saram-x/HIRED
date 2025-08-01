/* eslint-disable react/prop-types */
import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

/**
 * PROTECTED ROUTE COMPONENT
 * Handles authentication and role-based access control
 * Redirects unauthenticated users to sign-in
 * Redirects users without roles to onboarding
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.requiredRole - Required role to access this route (optional)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isSignedIn, isLoaded, user } = useUser();
  const { pathname } = useLocation();

  // Loading state
  if (!isLoaded) return null;

  // If not signed in, redirect to sign-in
  if (!isSignedIn) {
    return <Navigate to="/?sign-in=true" />;
  }

  const role = user?.unsafeMetadata?.role;

  // If a specific role is required and user doesn't have it, redirect to home
  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Redirect admin users to /admin if they try to access other pages
  if (role === "admin" && pathname !== "/admin") {
    return <Navigate to="/admin" />;
  }

  // If not admin and trying to access /admin, redirect to home
  if (role !== "admin" && pathname === "/admin") {
    return <Navigate to="/" replace />;
  }

  // If no role and not on onboarding, send to onboarding
  if (!role && pathname !== "/onboarding") {
    return <Navigate to="/onboarding" />;
  }

  // Everything is fine, allow access
  return children;
};

export default ProtectedRoute;