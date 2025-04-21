"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Halls", href: "/dashboard/halls" },
    { label: "Courses", href: "/dashboard/courses" },
    { label: "Supervisors", href: "/dashboard/supervisors" },
    { label: "Generate Timetable", href: "/dashboard/generate" },
  ];

  return (
    <div className="w-64 min-h-screen bg-white text-blue-800 p-6">
      <h2 className="text-xl font-bold mb-6">Exam System</h2>
      <ul className="space-y-4">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block hover:text-blue-400 transition duration-200 ${
                pathname === item.href ? "text-blue-400 font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
