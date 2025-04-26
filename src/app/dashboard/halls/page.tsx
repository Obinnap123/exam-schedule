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
  /* ---------- state ---------- */
  const [halls, setHalls] = useState<Hall[]>([
    { id: 1, name: "Main Hall", capacity: 120 },
    { id: 2, name: "Room A", capacity: 60 },
  ]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", capacity: "" });


   /* check for ?add=true in URL to open modal */
    const searchParams = useSearchParams();
    const shouldOpenModal = searchParams.get("add") === "true";
  
    useEffect(() => {
      if (shouldOpenModal) {
        setOpen(true);
      }
    }, [shouldOpenModal]);

  /* ---------- handlers ---------- */
  const addHall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.capacity) return;

    setHalls((prev) => [
      ...prev,
      { id: Date.now(), name: form.name, capacity: Number(form.capacity) },
    ]);
    setForm({ name: "", capacity: "" });
    setOpen(false);
  };

  const deleteHall = (id: number) =>
    setHalls((prev) => prev.filter((h) => h.id !== id));

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Halls</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Hall
        </button>
      </div>

      {/* table */}
      <table className="w-full overflow-hidden rounded border">
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
              <td className="p-3">
                {/* edit left for later */}
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

      {/* modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Hall">
        <form onSubmit={addHall} className="space-y-4">
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
