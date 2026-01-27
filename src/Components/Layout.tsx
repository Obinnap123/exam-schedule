"use client";
import React, { useState, useMemo } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { usePathname } from "next/navigation";

function Layout({ children }: { children: React.ReactNode }) {
  // Check if we're on the generate page
  const pathname = usePathname();
  const isGeneratePage = pathname.includes("/generate");

  // State to manage sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to toggle the sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Determine page title dynamically
  const pageTitle = useMemo(() => {
    if (pathname.includes("halls")) return "Examination Halls";
    if (pathname.includes("courses")) return "Courses Management";
    if (pathname.includes("supervisors")) return "Supervisors";
    if (pathname.includes("generate")) return "Generate Timetable";
    return "Dashboard Overview";
  }, [pathname]);

  // If we're on the generate page, render without dashboard layout
  // (Or maybe we want to keep it? The requirement says "Improve visual hierarchy". 
  // Usually generator is a full screen tool, but if it was excluded before, I'll keep excluding it or wrap it minimally.
  // The original code returned <>{children}</> for isGeneratePage. I will stick to that to avoid breaking flow,
  // but I'll add a check to make sure it's intentional. The comment says "without dashboard layout".)
  if (isGeneratePage) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full relative">
        {/* Topbar */}
        <Topbar title={pageTitle} onMenuClick={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

export default Layout;
