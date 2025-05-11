"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/Components/Modal";

type Hall = {
  id: number;
  name: string;
  capacity: number;
};

function HallPage() {
  /* ---------- State ---------- */
  const [halls, setHalls] = useState<Hall[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: 0, name: "", capacity: "" });
  const [isEditing, setIsEditing] = useState(false); // Track edit mode

  /* ---------- Query Parameters ---------- */
  const searchParams = useSearchParams();
  const shouldOpenModal = searchParams.get("add") === "true";

  useEffect(() => {
    if (shouldOpenModal) {
      setOpen(true);
    }
  }, [shouldOpenModal]);

  /* ---------- Fetch Halls from Backend ---------- */
  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const response = await fetch("/api/halls");
        if (!response.ok) {
          throw new Error("Failed to fetch halls.");
        }
        const data = await response.json();
        setHalls(data); // Update state with fetched halls
      } catch (error) {
        console.error(error);
        alert("Error fetching halls.");
      }
    };

    fetchHalls();
  }, []);

  /* ---------- Handlers ---------- */

  // Add or Edit a hall
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.capacity) return;

    try {
      const url = isEditing ? `/api/halls/${form.id}` : "/api/halls";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          capacity: parseInt(form.capacity, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(isEditing ? "Failed to update hall." : "Failed to create hall.");
      }

      const updatedOrNewHall = await response.json();

      if (isEditing) {
        setHalls((prev) =>
          prev.map((hall) => (hall.id === updatedOrNewHall.id ? updatedOrNewHall : hall))
        );
      } else {
        setHalls((prev) => [...prev, updatedOrNewHall]);
      }

      setForm({ id: 0, name: "", capacity: "" }); // Reset form
      setOpen(false); // Close modal
      setIsEditing(false); // Exit edit mode
    } catch (error) {
      console.error(error);
      alert(isEditing ? "Error updating hall." : "Error adding hall.");
    }
  };

  // Delete a hall
  const deleteHall = async (id: number) => {
    try {
      const response = await fetch(`/api/halls/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete hall.");
      }

      setHalls((prev) => prev.filter((hall) => hall.id !== id)); // Remove hall from state
    } catch (error) {
      console.error(error);
      alert("Error deleting hall.");
    }
  };

  // Open modal for editing
  const editHall = (hall: Hall) => {
    setForm({ id: hall.id, name: hall.name, capacity: String(hall.capacity) });
    setIsEditing(true);
    setOpen(true);
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Halls</h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setForm({ id: 0, name: "", capacity: "" });
            setOpen(true);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Hall
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-black">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {halls.map((hall, index) => (
              <tr
                key={hall.id}
                className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="p-3">{hall.name}</td>
                <td className="p-3">{hall.capacity}</td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => editHall(hall)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteHall(hall.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {halls.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center italic text-gray-500">
                  No halls yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={isEditing ? "Edit Hall" : "Add Hall"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Hall Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded border p-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Capacity</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="w-full rounded border p-2"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default HallPage;