// Sidebar.tsx
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Halls", href: "/dashboard/halls" },
    { label: "Courses", href: "/dashboard/courses" },
    { label: "Supervisors", href: "/dashboard/supervisors" },
    { label: "Generate Timetable", href: "/dashboard/generate" },
  ];

  return (
    <>
      {/* Sidebar Content */}
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed top-0 left-0 w-64 min-h-[100dvh] bg-white text-blue-800 p-6 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:block`}
      >
        {/* Close Button */}
        <div className="flex justify-end md:hidden">
          <span
            className="material-icons cursor-pointer"
            onClick={toggleSidebar}
          >
            close
          </span>
        </div>

        {/* Sidebar Links */}
        <h2 className="text-xl font-bold mb-6">Exam System</h2>
        <ul className="space-y-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block hover:text-blue-400 transition duration-200 ${
                  pathname === item.href ? "text-blue-400 font-semibold" : ""
                }`}
                onClick={toggleSidebar} 
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Sidebar;