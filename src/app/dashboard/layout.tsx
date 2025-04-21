"use client";

import Header from "@/Components/Header";
import Sidebar from "@/Components/Sidebar";
import Topbar from "@/Components/Topbar";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const pageTitle = useMemo(() => {
    if (pathname.includes("halls")) return "Halls";
    if (pathname.includes("courses")) return "Courses";
    if (pathname.includes("supervisors")) return "Supervisors";
    if (pathname.includes("generate")) return "Generate Timetable";
    return "Dashboard";
  }, [pathname]);

  return (
    <>
      <Header />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full max-w-[950px] mx-auto">
          <Topbar title={pageTitle} />
          <main className="p-6 bg-white min-h-screen my-[30px] rounded-[5px]">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
