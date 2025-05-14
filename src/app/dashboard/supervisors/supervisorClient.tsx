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

  const resetForm = () =>
    setForm({ fullName: "", email: "", phone: "", department: "" });

  const addSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) return;

    const exists = supervisors.some(
      (s) => s.email.toLowerCase() === form.email.toLowerCase()
    );
    if (exists && editingSupervisorId === null) {
      alert("A supervisor with that email already exists!");
      return;
    }

    if (editingSupervisorId !== null) {
      setSupervisors((prev) =>
        prev.map((s) =>
          s.id === editingSupervisorId
            ? { id: editingSupervisorId, ...form }
            : s
        )
      );
    } else {
      setSupervisors((prev) => [...prev, { id: Date.now(), ...form }]);
    }

    resetForm();
    setEditingSupervisorId(null);
    setOpen(false);
  };

  const deleteSupervisor = (id: number) =>
    setSupervisors((prev) => prev.filter((s) => s.id !== id));

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
