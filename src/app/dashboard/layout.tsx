"use client";
import React, { useState, useMemo } from "react";
import Header from "@/Components/Header";
import Sidebar from "@/Components/Sidebar";
import Topbar from "@/Components/Topbar";
import { usePathname } from "next/navigation";

function Layout({ children }: { children: React.ReactNode }) {
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

  // Only show sidebar/topbar if NOT on /dashboard/generate
  const isGeneratePage = pathname === "/dashboard/generate";

  return (
    <>
      {/* Header */}
      {!isGeneratePage && (
        <Header isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        {!isGeneratePage && (
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        )}

        {/* Content Area */}
        <div
          className={
            !isGeneratePage
              ? "flex-1 flex flex-col w-[100%] lg:max-w-[700px] xl:max-w-[970px] [@media(min-width:1440px)]:max-w-[1100px] mx-auto"
              : "flex-1 flex flex-col w-full h-full"
          }
        >
          {!isGeneratePage && <Topbar title={pageTitle} />}
          <main
            className={
              !isGeneratePage
                ? "p-4 md:p-6 min-h-[90dvh] bg-white my-[30px] rounded-[5px]"
                : "min-h-screen"
            }
          >
            {children}
          </main>
        </div>
      </div>

      {/* Overlay (optional, to dim the background when the sidebar is open on mobile) */}
      {!isGeneratePage && isSidebarOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}

export default Layout;
