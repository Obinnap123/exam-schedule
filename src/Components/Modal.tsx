"use client";
import React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;

  children: React.ReactNode;
};

function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 text-black">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-xl leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export default Modal;
