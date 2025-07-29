"use client";
import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

function Layout({ children }: { children: React.ReactNode }) {
  // Check if we're on the generate page
  const isGeneratePage = usePathname().includes('/generate');
  const pathname = usePathname();

  // State to manage sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Function to toggle the sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Determine page title dynamically
  const pageTitle = useMemo(() => {
    if (pathname.includes("halls")) return "Halls";
    if (pathname.includes("courses")) return "Courses";
    if (pathname.includes("supervisors")) return "Supervisors";
    if (pathname.includes("generate")) return "Generate Timetable";
    return "Dashboard";
  }, [pathname]);

  // If we're on the generate page, render without dashboard layout
  if (isGeneratePage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Header */}
      <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* Content Area */}
        <div className="flex-1 flex flex-col w-[100%] lg:max-w-[700px] xl:max-w-[970px] [@media(min-width:1440px)]:max-w-[1100px] mx-auto">
          <Topbar title={pageTitle} />
          <main className="p-4 md:p-6 min-h-[100dvh] bg-white my-[30px] rounded-[5px]">
            {children}
          </main>
        </div>
      </div>

      {/* Overlay (optional, to dim the background when the sidebar is open on mobile) */}
      {isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}

export default Layout;
