"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import StatusPill from "@/components/StatusPill";
import type { ContentItem, Section } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/types";

const SECTIONS: { key: Section | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "facebook", label: SECTION_LABEL.facebook },
  { key: "linkedin", label: SECTION_LABEL.linkedin },
  { key: "she_came", label: SECTION_LABEL.she_came },
  { key: "portraits", label: SECTION_LABEL.portraits },
  { key: "hijoltola", label: SECTION_LABEL.hijoltola },
];

function ContentListInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeSection = (searchParams.get("section") as Section | null) ?? "all";

  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const url = activeSection === "all" ? "/api/content" : `/api/content?section=${activeSection}`;
    const res = await fetch(url);
    const data = await res.json();
    setItems(data.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  async function toggleStatus(item: ContentItem) {
    const newStatus = item.status === "posted" ? "drafted" : "posted";
    setItems((prev) =>
      prev ? prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i)) : prev
    );
    await fetch(`/api/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  const counts = items
    ? {
        posted: items.filter((i) => i.status === "posted").length,
        drafted: items.filter((i) => i.status === "drafted").length,
        needs_facts: items.filter((i) => i.status === "needs_facts").length,
        idea: items.filter((i) => i.status === "idea").length,
      }
    : null;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <h1 className="font-ui text-2xl font-semibold text-paper mb-1">Content</h1>
      <p className="font-ui text-xs text-smoke mb-5">
        Every draft, post, and idea across channels.
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() =>
              router.push(s.key === "all" ? "/content" : `/content?section=${s.key}`)
            }
            className={`font-ui text-[13px] font-medium px-3.5 py-1.5 rounded-full border ${
              activeSection === s.key
                ? "bg-brass text-ink border-brass"
                : "border-border text-smoke hover:text-paper"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {counts && (
        <div className="flex gap-5 font-ui text-xs text-smoke mb-5">
          <span>
            <b className="text-paper">{counts.posted}</b> posted
          </span>
          <span>
            <b className="text-paper">{counts.drafted}</b> drafted
          </span>
          <span>
            <b className="text-paper">{counts.needs_facts}</b> needs facts
          </span>
          <span>
            <b className="text-paper">{counts.idea}</b> idea
          </span>
        </div>
      )}

      {loading && <div className="font-ui text-sm text-smoke py-10 text-center">Loading…</div>}

      {!loading && items && items.length === 0 && (
        <div className="font-ui text-sm text-smoke py-10 text-center">
          Nothing here yet — draft your first post for this channel.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items?.map((item) => (
          <div
            key={item.id}
            className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/content/${item.id}`}
                className={`block text-[15px] font-medium text-paper hover:text-brass truncate ${
                  item.language === "bn" ? "font-content-bn" : "font-content-en"
                }`}
              >
                {item.title}
              </Link>
              <div className="font-ui text-[11px] text-smoke mt-0.5 truncate">{item.type}</div>
            </div>
            <StatusPill status={item.status} />
            <button
              onClick={() => toggleStatus(item)}
              className={`font-ui text-xs font-medium px-3 py-1.5 rounded-md border shrink-0 ${
                item.status === "posted"
                  ? "border-moss text-moss"
                  : "bg-brass text-ink border-brass"
              }`}
            >
              {item.status === "posted" ? "Mark as draft" : "Mark as posted"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContentListPage() {
  return (
    <Suspense fallback={<div className="p-8 font-ui text-sm text-smoke">Loading…</div>}>
      <ContentListInner />
    </Suspense>
  );
}
