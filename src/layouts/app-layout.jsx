import Header from "@/components/header";
import { Outlet } from "react-router-dom";

/**
 * MAIN APPLICATION LAYOUT
 * Provides consistent header and footer across all pages
 * Uses React Router's Outlet for page content
 */
const AppLayout = () => {
  return (
    <div>
      {/* Animated background grid pattern */}
      <div className="grid-background"></div>
      <main className="min-h-screen container">
        <Header />
        {/* Page content will be rendered here */}
        <Outlet />
      </main>
      <div className="p-10 text-center bg-gray-800 mt-10">
        Made by MAO Students
      </div>
    </div>
  );
};

export default AppLayout;