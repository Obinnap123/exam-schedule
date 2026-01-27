"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

function Modal({ open, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!mounted || !open) return null;

  // Utilize createPortal for proper stacking context independent of parent
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-lg overflow-y-auto scroll-thin rounded-2xl bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200 flex flex-col"
        style={{ maxHeight: 'calc(100vh - 4rem)' }}
      >
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900 pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
