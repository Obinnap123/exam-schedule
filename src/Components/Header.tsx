"use client";
import React from "react";

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <div className="w-[100%] flex justify-between bg-indigo-900 p-4 items-center text-white">
      {/* Title */}
      <div className="text-2xl">
        <span className="md:hidden">Exam Scheduling</span>
        <span className="hidden md:inline">
          AI-Powered Exam Scheduling System
        </span>
      </div>

      {/* Menu Icon (visible only on mobile) */}
      <div className="md:hidden">
        <span
          className="material-icons cursor-pointer"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? "close" : "menu"}
        </span>
      </div>
    </div>
  );
}

export default Header;
