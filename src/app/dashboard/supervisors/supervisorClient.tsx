"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/Components/Modal";

/* ---------- Types ---------- */
type Supervisor = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  department?: string;
};

/* ---------- Component ---------- */
function SupervisorClient({ initialSupervisors = [] }: { initialSupervisors: Supervisor[] }) {
  const [supervisors, setSupervisors] = useState<Supervisor[]>(initialSupervisors);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Supervisor, "id">>({
    fullName: "",
    email: "",
    phone: "",
    department: "",
  });

  const [editingSupervisorId, setEditingSupervisorId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const shouldOpenModal = searchParams.get("add") === "true";

  useEffect(() => {
    if (shouldOpenModal) {
      setOpen(true);
    }
  }, [shouldOpenModal]);

  useEffect(() => {
    // GET request to fetch all supervisors
    const fetchSupervisors = async () => {
      try {
        const response = await fetch("/api/supervisors");
        if (!response.ok) throw new Error("Failed to fetch supervisors");
        const data = await response.json();
        setSupervisors(data);
      } catch (error) {
        console.error("Error fetching supervisors:", error);
      }
    };

    fetchSupervisors();
  }, []);

  const resetForm = () =>
    setForm({ fullName: "", email: "", phone: "", department: "" });

  const addSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) return;

    try {
      const method = editingSupervisorId !== null ? "PATCH" : "POST";
      const url =
        editingSupervisorId !== null
          ? `/api/supervisors/${editingSupervisorId}`
          : "/api/supervisors";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to save supervisor");

      const savedSupervisor = await response.json();

      setSupervisors((prev) => {
        if (editingSupervisorId !== null) {
          return prev.map((s) =>
            s.id === editingSupervisorId ? savedSupervisor : s
          );
        } else {
          return [...prev, savedSupervisor];
        }
      });

      resetForm();
      setEditingSupervisorId(null);
      setOpen(false);
    } catch (error) {
      console.error("Error saving supervisor:", error);
    }
  };

  const deleteSupervisor = async (id: number) => {
    try {
      const response = await fetch(`/api/supervisors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete supervisor");

      setSupervisors((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting supervisor:", error);
    }
  };

  const startEditing = (supervisor: Supervisor) => {
    setForm({
      fullName: supervisor.fullName,
      email: supervisor.email,
      phone: supervisor.phone || "",
      department: supervisor.department || "",
    });
    setEditingSupervisorId(supervisor.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Supervisors</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingSupervisorId(null);
            setOpen(true);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Supervisor
        </button>
      </div>

      <table className="w-full overflow-hidden rounded border text-black">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Department</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {supervisors.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-3">{s.fullName}</td>
              <td className="p-3">{s.email}</td>
              <td className="p-3">{s.phone ?? "-"}</td>
              <td className="p-3">{s.department ?? "-"}</td>
              <td className="p-3 space-x-2">
                <button
                  onClick={() => startEditing(s)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteSupervisor(s.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {supervisors.length === 0 && (
            <tr>
              <td colSpan={5} className="p-6 text-center italic text-gray-500">
                No supervisors yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal
        open={open}
        onClose={() => {
          resetForm();
          setEditingSupervisorId(null);
          setOpen(false);
        }}
        title={editingSupervisorId ? "Edit Supervisor" : "Add Supervisor"}
      >
        <form onSubmit={addSupervisor} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={`w-full rounded border p-2 ${
                form.fullName ? "text-black" : "text-gray-500"
              }`}
              placeholder="Dr Amina Balogun"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full rounded border p-2 ${
                form.email ? "text-black" : "text-gray-500"
              }`}
              placeholder="amina@uni.edu"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Phone (optional)
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`w-full rounded border p-2 ${
                form.phone ? "text-black" : "text-gray-500"
              }`}
              placeholder="0803-123-4567"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Department (optional)
            </label>
            <input
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
              className={`w-full rounded border p-2 ${
                form.department ? "text-black" : "text-gray-500"
              }`}
              placeholder="Computer Science"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditingSupervisorId(null);
                setOpen(false);
              }}
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

export default SupervisorClient;
