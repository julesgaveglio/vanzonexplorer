"use client";

import { useState, useEffect } from "react";
import { List, X } from "lucide-react";

export default function VBAMobileDrawer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Block body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* Floating toggle */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold text-white shadow-lg active:scale-95 transition-transform"
        style={{
          background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
          boxShadow: "0 4px 20px rgba(185, 148, 95, 0.45)",
        }}
      >
        <List className="w-4 h-4" />
        Modules
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet — full width, no gap */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-slate-100">
          <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 active:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar content — click on a lesson link closes the drawer */}
        <div
          className="overflow-y-auto overscroll-contain"
          style={{ maxHeight: "calc(85vh - 48px)" }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) {
              setTimeout(() => setOpen(false), 150);
            }
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
