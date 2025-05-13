"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/Components/Modal";

/* ---------- types ---------- */
type Supervisor = {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
};

/* ---------- component ---------- */
function SupervisorClient() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([
    {
      id: 1,
      fullName: "Dr Amina Balogun",
      email: "amina@uni.edu",
      phone: "08030000000",
    },
  ]);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<Supervisor, "id">>({
    fullName: "",
    email: "",
    phone: "",
  });

  /* check for ?add=true in URL to open modal */
  const searchParams = useSearchParams();
  const shouldOpenModal = searchParams.get("add") === "true";

  useEffect(() => {
    if (shouldOpenModal) {
      setOpen(true);
    }
  }, [shouldOpenModal]);

  /* helpers */
  const resetForm = () => setForm({ fullName: "", email: "", phone: "" });

  /* handlers */
  const addSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) return;

    const exists = supervisors.some(
      (s) => s.email.toLowerCase() === form.email.toLowerCase()
    );
    if (exists) {
      alert("A supervisor with that email already exists!");
      return;
    }

    setSupervisors((prev) => [...prev, { id: Date.now(), ...form }]);
    resetForm();
    setOpen(false);
  };

  const deleteSupervisor = (id: number) =>
    setSupervisors((prev) => prev.filter((s) => s.id !== id));

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Supervisors</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Supervisor
        </button>
      </div>

      {/* table */}
      <table className="w-full overflow-hidden rounded border text-black">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Phone</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {supervisors.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-3">{s.fullName}</td>
              <td className="p-3">{s.email}</td>
              <td className="p-3">{s.phone ?? "-"}</td>
              <td className="p-3">
                {/* edit left for later */}
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
              <td colSpan={4} className="p-6 text-center italic text-gray-500">
                No supervisors yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Supervisor">
        <form onSubmit={addSupervisor} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full rounded border p-2"
              placeholder="Dr Amina Balogun"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded border p-2"
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
              className="w-full rounded border p-2"
              placeholder="0803‑123‑4567"
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
export default SupervisorClient;
