"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// TEMP: import mock arrays so the counts show
// import { initialHalls } from "../halls/mock";
// import { initialCourses } from "../courses/mock";
// import { initialSupervisors } from "../supervisors/mock";

const dummyHalls = [
  { id: 1, name: "Main Hall", capacity: 120 },
  { id: 2, name: "Room A", capacity: 60 },
];

const dummyCourses = [
  { id: 1, code: "CSC 301" },
  { id: 2, code: "MTH 202" },
];

const dummySupervisors = [{ id: 1, fullName: "Dr Amina Balogun" }];

function DashboardHome() {
  const router = useRouter();

  const [halls] = useState(dummyHalls);
  const [courses] = useState(dummyCourses);
  const [supervisors] = useState(dummySupervisors);

  /* cards config */
  const cards = [
    { label: "Halls", count: halls.length, href: "/dashboard/halls" },
    { label: "Courses", count: courses.length, href: "/dashboard/courses" },
    {
      label: "Supervisors",
      count: supervisors.length,
      href: "/dashboard/supervisors",
    },
  ];

  return (
    <div className="space-y-8">
      {/* greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
        <p className="text-gray-600">Quick overview of your exam setup.</p>
      </div>

      {/* stat cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            onClick={() => router.push(c.href)}
            className="cursor-pointer rounded-lg border p-6 shadow hover:shadow-md transition"
          >
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{c.count}</p>
          </div>
        ))}
      </div>

      {/* quick actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-black">Quick actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/dashboard/halls?add=true"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Hall
          </Link>
          <Link
            href="/dashboard/courses?add=true"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Course
          </Link>
          <Link
           href="/dashboard/supervisors?add=true"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Supervisor
          </Link>
          <Link
            href="/dashboard/generate"
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Generate Timetable
          </Link>
        </div>
      </div>
    </div>
  );
}
export default DashboardHome;
