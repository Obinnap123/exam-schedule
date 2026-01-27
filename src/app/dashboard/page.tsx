"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Calendar, Users, BookOpen, School, AlertTriangle } from "lucide-react";

export default function DashboardHome() {
  const router = useRouter();

  const [halls, setHalls] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          router.push("/login");
          return;
        }

        const user = JSON.parse(storedUser);
        const headers = {
          "Content-Type": "application/json",
          "X-User-Id": user.id.toString()
        };

        // Fetch using Promise.all for better performance
        const [hallsRes, coursesRes, supervisorsRes] = await Promise.all([
          fetch("/api/halls", { headers }),
          fetch("/api/courses", { headers }),
          fetch("/api/supervisors", { headers })
        ]);

        if (hallsRes.status === 401 || coursesRes.status === 401 || supervisorsRes.status === 401) {
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        const hallsData = await hallsRes.json();
        const coursesData = await coursesRes.json();
        const supervisorsData = await supervisorsRes.json();

        setHalls(Array.isArray(hallsData) ? hallsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setSupervisors(Array.isArray(supervisorsData) ? supervisorsData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard data. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  /* cards config */
  const cards = [
    {
      label: "Total Halls",
      count: halls.length,
      href: "/dashboard/halls",
      icon: School,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Courses",
      count: courses.length,
      href: "/dashboard/courses",
      icon: BookOpen,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Supervisors",
      count: supervisors.length,
      href: "/dashboard/supervisors",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-500">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>

        <Link
          href="/dashboard/generate"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg shadow-indigo-500/20"
        >
          <Calendar className="w-4 h-4" />
          Generate Timetable
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeletons for cards
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse bg-white"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="h-4 bg-slate-100 rounded w-24 mb-3"></div>
                    <div className="h-8 bg-slate-100 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          cards.map((c) => (
            <div
              key={c.label}
              onClick={() => router.push(c.href)}
              className="group cursor-pointer rounded-2xl border border-slate-200 p-6 bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{c.label}</p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {c.count}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${c.bg} ${c.color} group-hover:scale-110 transition-transform duration-200`}>
                  <c.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* quick actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/halls?add=true"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm transition-all font-medium"
          >
            <div className="p-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
              <Plus className="w-4 h-4" />
            </div>
            Add Examination Hall
          </Link>
          <Link
            href="/dashboard/courses?add=true"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm transition-all font-medium"
          >
            <div className="p-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
              <Plus className="w-4 h-4" />
            </div>
            Add New Course
          </Link>
          <Link
            href="/dashboard/supervisors?add=true"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm transition-all font-medium"
          >
            <div className="p-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600">
              <Plus className="w-4 h-4" />
            </div>
            Register Supervisor
          </Link>
        </div>
      </div>
    </div>
  );
}
