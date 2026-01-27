"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Modal from "@/Components/Modal";
import { School } from "lucide-react";

type Hall = {
  id: number;
  name: string;
  capacity: number | null;
};

interface HallPageClientProps {
  initialHalls: Hall[];
}

function HallPageClient({ initialHalls }: HallPageClientProps) {
  const router = useRouter();
  /* ---------- State ---------- */
  const [halls, setHalls] = useState<Hall[]>(initialHalls);
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

  // Auth Helper
  const getAuthHeaders = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return null;
    }
    const user = JSON.parse(storedUser);
    return {
      "Content-Type": "application/json",
      "X-User-Id": user.id.toString(),
    };
  };

  /* ---------- Refresh Halls from Backend ---------- */
  useEffect(() => {
    const refreshHalls = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const response = await fetch("/api/halls", { headers });
        if (response.status === 401) {
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch halls.");
        }
        const data = await response.json();
        setHalls(data); // Update state with fetched halls
      } catch (error) {
        console.error(error);
      }
    };

    refreshHalls();
  }, [initialHalls]);

  /* ---------- Handlers ---------- */

  // Add or Edit a hall
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.capacity) return;

    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const url = isEditing ? `/api/halls/${form.id}` : "/api/halls";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: form.name,
          capacity: parseInt(form.capacity, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(
          isEditing ? "Failed to update hall." : "Failed to create hall."
        );
      }

      const updatedOrNewHall = await response.json();

      if (isEditing) {
        setHalls((prev) =>
          prev.map((hall) =>
            hall.id === updatedOrNewHall.id ? updatedOrNewHall : hall
          )
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
    if (!confirm("Are you sure you want to delete this hall?")) return;
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/halls/${id}`, {
        method: "DELETE",
        headers,
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
        <h1 className="text-2xl font-bold text-black">Examination Halls</h1>
        <button
          onClick={() => {
            setIsEditing(false);
            setForm({ id: 0, name: "", capacity: "" });
            setOpen(true);
          }}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 shadow-md transition-all font-medium"
        >
          + Add Hall
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full border-collapse text-left text-sm text-slate-700">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 font-semibold text-slate-900">Name</th>
              <th className="p-4 font-semibold text-slate-900">Capacity</th>
              <th className="p-4 font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {halls.map((hall) => (
              <tr key={hall.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{hall.name}</td>
                <td className="p-4">{hall.capacity || 'N/A'}</td>
                <td className="p-4 space-x-3">
                  <button
                    onClick={() => editHall(hall)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteHall(hall.id)}
                    className="text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {halls.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="p-8 text-center italic text-slate-500"
                >
                  No halls found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid gap-4">
        {halls.map((hall) => (
          <div key={hall.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{hall.name}</h3>
                <p className="text-sm text-slate-500">Capacity: {hall.capacity}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => editHall(hall)}
                className="text-sm px-3 py-1 bg-slate-100 text-slate-700 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => deleteHall(hall.id)}
                className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {halls.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            No halls found.
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isEditing ? "Edit Hall" : "Add Hall"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Hall Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Lecture Theatre A"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Capacity</label>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="100"
              required
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 shadow-md font-medium transition-colors"
            >
              {isEditing ? "Save Changes" : "Create Hall"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default HallPageClient;
