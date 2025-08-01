import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ClerkProvider } from "@clerk/clerk-react";
import { shadesOfPurple } from "@clerk/themes";

/**
 * APPLICATION ENTRY POINT
 * Sets up Clerk authentication with custom theme
 * Wraps the entire app with authentication context
 */

// Import Clerk publishable key from environment
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      appearance={{
        baseTheme: shadesOfPurple, // Custom purple theme for auth UI
      }}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/" // Redirect to landing page after sign out
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);