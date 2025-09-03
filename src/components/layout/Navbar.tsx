"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Trophy,
  CalendarDays,
  Wrench,
  Activity,
  Flag,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/standings", label: "Standings", icon: Trophy },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/pitstop", label: "Pit Stop", icon: Wrench },
  { href: "/live", label: "Live", icon: Activity },
  { href: "/results", label: "Results", icon: Flag },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/constructors", label: "Constructors", icon: Building2 },
];

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const [width, setWidth] = useState<number>(256);
  const [dragging, setDragging] = useState(false);

  // Restore persisted width
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = Number(localStorage.getItem("sidebarWidth"));
    if (saved && !Number.isNaN(saved)) setWidth(Math.min(360, Math.max(56, saved)));
  }, []);

  // Persist width changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("sidebarWidth", String(width));
  }, [width]);

  // Drag handlers
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startWidth = width;
    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const next = Math.min(360, Math.max(56, startWidth + dx));
      setWidth(next);
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <aside
      className={`h-dvh sticky top-0 z-20 border-r border-white/10 bg-black/60 backdrop-blur select-none`}
      style={{ width: open ? width : 64 }}
    >
      <div className="h-full flex flex-col relative">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10">
          <button
            aria-label="Toggle sidebar"
            className="p-1.5 rounded hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
          {open && (
            <Link href="/" className="ml-1 font-semibold text-f1-red truncate">F1 Dash</Link>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  title={!open ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {open && <span className="truncate">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Resize handle */}
        <div
          onMouseDown={onMouseDown}
          className={`absolute right-0 top-0 h-full w-1.5 cursor-col-resize ${dragging ? "bg-white/20" : "bg-transparent"}`}
        />
      </div>
    </aside>
  );
}
