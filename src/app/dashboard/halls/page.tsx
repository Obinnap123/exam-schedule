"use client";

import { useState } from "react";

function HallPage() {
  const [halls, setHalls] = useState([
    { id: 1, name: "Main Hall", capacity: 100 },
    { id: 2, name: "Room A", capacity: 50 },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-black">
        <h1 className="text-2xl font-bold">Halls</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Add Hall
        </button>
      </div>

      <table className="w-full border border-gray-200 rounded shadow-sm  text-black">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Capacity</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {halls.map((hall) => (
            <tr key={hall.id} className="border-t">
              <td className="p-3">{hall.name}</td>
              <td className="p-3">{hall.capacity}</td>
              <td className="p-3 space-x-2">
                <button className="text-blue-600 hover:underline">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default HallPage;
