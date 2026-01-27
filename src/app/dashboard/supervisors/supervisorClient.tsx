"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Modal from "@/Components/Modal";

/* ---------- Types ---------- */
type Supervisor = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
};

/* ---------- Component ---------- */
function SupervisorClient({ initialSupervisors = [] }: { initialSupervisors: Supervisor[] }) {
  const router = useRouter();
  const [supervisors, setSupervisors] = useState<Supervisor[]>(initialSupervisors);
  const [open, setOpen] = useState(false);
  type SupervisorForm = {
    fullName: string;
    email: string;
    phone: string;
    department: string;
  };

  const [form, setForm] = useState<SupervisorForm>({
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

  useEffect(() => {
    // GET request to fetch all supervisors
    const fetchSupervisors = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        const response = await fetch("/api/supervisors", { headers });
        if (response.status === 401) {
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }

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
      const headers = getAuthHeaders();
      if (!headers) return;

      const method = editingSupervisorId !== null ? "PATCH" : "POST";
      const url =
        editingSupervisorId !== null
          ? `/api/supervisors/${editingSupervisorId}`
          : "/api/supervisors";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...form,
          phone: form.phone || null,
          department: form.department || null,
        }),
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
    if (!confirm("Are you sure you want to delete this supervisor?")) return;
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/supervisors/${id}`, {
        method: "DELETE",
        headers,
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
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 shadow-md transition-all font-medium"
        >
          + Add Supervisor
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 font-semibold text-slate-900">Name</th>
              <th className="p-4 font-semibold text-slate-900">Email</th>
              <th className="p-4 font-semibold text-slate-900">Phone</th>
              <th className="p-4 font-semibold text-slate-900">Department</th>
              <th className="p-4 font-semibold text-slate-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {supervisors.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{s.fullName}</td>
                <td className="p-4">{s.email}</td>
                <td className="p-4">{s.phone ?? "-"}</td>
                <td className="p-4">{s.department ?? "-"}</td>
                <td className="p-4 space-x-3">
                  <button
                    onClick={() => startEditing(s)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSupervisor(s.id)}
                    className="text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {supervisors.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                  No supervisors yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden grid gap-4">
        {supervisors.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{s.fullName}</h3>
                <p className="text-sm text-indigo-600">{s.email}</p>
              </div>
            </div>
            <div className="text-sm text-slate-500 grid grid-cols-2 gap-2">
              <span className="truncate">Phone: {s.phone || '-'}</span>
              <span className="truncate text-right">Dept: {s.department || '-'}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => startEditing(s)}
                className="text-sm font-medium text-indigo-600"
              >
                Edit
              </button>
              <button
                onClick={() => deleteSupervisor(s.id)}
                className="text-sm font-medium text-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {supervisors.length === 0 && (
          <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
            No supervisors yet.
          </div>
        )}
      </div>

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
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={`w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${form.fullName ? "text-black" : "text-gray-500"
                }`}
              placeholder="Dr Amina Balogun"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${form.email ? "text-black" : "text-gray-500"
                }`}
              placeholder="amina@uni.edu"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone (optional)
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${form.phone ? "text-black" : "text-gray-500"
                }`}
              placeholder="0803-123-4567"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Department (optional)
            </label>
            <input
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
              className={`w-full rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none ${form.department ? "text-black" : "text-gray-500"
                }`}
              placeholder="Computer Science"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditingSupervisorId(null);
                setOpen(false);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg font-medium transition-all"
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
