// src/Components/Sidebar.tsx
"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  Users,
  CalendarDays,
  X,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Halls", href: "/dashboard/halls", icon: Building2 },
    { label: "Courses", href: "/dashboard/courses", icon: BookOpen },
    { label: "Supervisors", href: "/dashboard/supervisors", icon: Users },
    { label: "Generate Timetable", href: "/dashboard/generate", icon: CalendarDays },
  ];

  return (
    <>
      {/* Sidebar Content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Header / Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <span className="font-bold text-lg">E</span>
              </div>
              <span className="text-lg font-bold tracking-wide">Scheduler</span>
            </div>

            {/* Close Button (Mobile) */}
            <button
              onClick={toggleSidebar}
              className="md:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    }`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer / User Info */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 group-hover:text-red-400" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
