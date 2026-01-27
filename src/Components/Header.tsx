"use client";
import React from "react";
import { Menu, X, FileText } from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-xl shadow-sm">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-slate-800">
                Exam Scheduler
              </h1>
              <p className="text-xs text-slate-500">
                AI-Powered Scheduling System
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-semibold text-slate-800">
                Exam Scheduler
              </h1>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
