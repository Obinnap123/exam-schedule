import React from 'react'

function Sidebar() {
  return (
    <>
    <div className="w-64 h-screen-[130px] bg-white text-blue-800 p-6">
      <h2 className="text-xl font-bold mb-6">Exam System</h2>
      <ul className="space-y-4">
        <li className="hover:text-blue-400 cursor-pointer">Dashboard</li>
        <li className="hover:text-blue-400 cursor-pointer">Halls</li>
        <li className="hover:text-blue-400 cursor-pointer">Courses</li>
        <li className="hover:text-blue-400 cursor-pointer">Supervisors</li>
        <li className="hover:text-blue-400 cursor-pointer">Generate Timetable</li>
      </ul>
    </div>
    </>
  )
}

export default Sidebar