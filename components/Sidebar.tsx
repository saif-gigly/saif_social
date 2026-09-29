"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_LABEL } from "@/lib/types";

const CHANNELS: { key: string; label: string }[] = [
  { key: "facebook", label: SECTION_LABEL.facebook },
  { key: "linkedin", label: SECTION_LABEL.linkedin },
  { key: "she_came", label: SECTION_LABEL.she_came },
  { key: "portraits", label: SECTION_LABEL.portraits },
  { key: "hijoltola", label: SECTION_LABEL.hijoltola },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-sm font-ui font-medium border-l-2 transition-colors ${
        active
          ? "border-brass text-paper bg-white/5"
          : "border-transparent text-smoke hover:text-paper hover:bg-white/5"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-card min-h-screen sticky top-0 flex flex-col">
      <div className="px-4 py-5">
        <div className="font-ui font-semibold text-sm text-paper">Content Ops</div>
        <div className="font-ui text-[11px] text-smoke mt-0.5">Saif Rashid</div>
      </div>

      <nav className="px-2 flex flex-col gap-0.5">
        <div className="px-3 pt-2 pb-1 font-ui text-[10px] uppercase tracking-wide text-smoke">
          Channels
        </div>
        {CHANNELS.map((c) => (
          <NavLink
            key={c.key}
            href={`/content?section=${c.key}`}
            label={c.label}
            active={pathname === "/content" && typeof window !== "undefined" && window.location.search.includes(c.key)}
          />
        ))}
        <NavLink href="/content" label="All content" active={pathname === "/content" && typeof window !== "undefined" && !window.location.search} />
      </nav>

      <div className="h-px bg-border mx-3 my-3" />

      <nav className="px-2 flex flex-col gap-0.5">
        <NavLink href="/calendar" label="Calendar" active={pathname === "/calendar"} />
        <NavLink href="/analytics" label="Analytics" active={pathname === "/analytics"} />
      </nav>

      <div className="mt-auto px-4 py-4 font-ui text-[10px] text-smoke">
        v0 — Facebook API not yet connected
      </div>
    </aside>
  );
}
