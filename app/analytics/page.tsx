"use client";

import { useEffect, useState } from "react";
import type { ContentItem, Status } from "@/lib/types";
import { STATUS_LABEL, SECTION_LABEL } from "@/lib/types";

const STATUS_COLOR: Record<Status, string> = {
  posted: "bg-moss",
  drafted: "bg-brass",
  needs_facts: "bg-rust",
  idea: "bg-smoke",
};

export default function AnalyticsPage() {
  const [items, setItems] = useState<ContentItem[] | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/content");
      const data = await res.json();
      setItems(data.items);
    })();
  }, []);

  if (!items) {
    return <div className="max-w-4xl mx-auto px-8 py-8 font-ui text-sm text-smoke">Loading…</div>;
  }

  const total = items.length;
  const posted = items.filter((i) => i.status === "posted").length;
  const bySection: Record<string, ContentItem[]> = {};
  for (const i of items) {
    (bySection[i.section] ||= []).push(i);
  }

  const statusOrder: Status[] = ["posted", "drafted", "needs_facts", "idea"];
  const statusCounts = statusOrder.map((s) => ({
    status: s,
    count: items.filter((i) => i.status === s).length,
  }));

  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <h1 className="font-ui text-2xl font-semibold text-paper mb-1">Analytics</h1>
      <p className="font-ui text-xs text-smoke mb-6">
        Pipeline measurement for now — reach, reactions, comments and shares will populate here
        once the Facebook API is connected.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <MetricCard label="Total items" value={total} />
        <MetricCard label="Posted" value={posted} accent="text-moss" />
        <MetricCard
          label="Posting rate"
          value={total ? `${Math.round((posted / total) * 100)}%` : "—"}
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-8">
        <div className="font-ui text-[11px] uppercase tracking-wide text-smoke mb-3">
          Status breakdown
        </div>
        <div className="flex h-3 rounded-full overflow-hidden mb-3">
          {statusCounts.map(
            (s) =>
              s.count > 0 && (
                <div
                  key={s.status}
                  className={STATUS_COLOR[s.status]}
                  style={{ width: `${(s.count / total) * 100}%` }}
                />
              )
          )}
        </div>
        <div className="flex gap-5 flex-wrap font-ui text-xs text-smoke">
          {statusCounts.map((s) => (
            <span key={s.status} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[s.status]}`} />
              {STATUS_LABEL[s.status]} · <b className="text-paper">{s.count}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="font-ui text-[11px] uppercase tracking-wide text-smoke mb-3">
          By channel
        </div>
        <div className="flex flex-col gap-2">
          {Object.entries(bySection).map(([section, sectionItems]) => {
            const postedCount = sectionItems.filter((i) => i.status === "posted").length;
            return (
              <div key={section} className="flex items-center gap-3 font-ui text-xs">
                <span className="w-24 text-smoke shrink-0">
                  {SECTION_LABEL[section as keyof typeof SECTION_LABEL] ?? section}
                </span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-moss"
                    style={{ width: `${(postedCount / sectionItems.length) * 100}%` }}
                  />
                </div>
                <span className="text-paper w-16 text-right shrink-0">
                  {postedCount}/{sectionItems.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="font-ui text-[11px] uppercase tracking-wide text-smoke mb-1">{label}</div>
      <div className={`font-ui text-[28px] font-semibold ${accent ?? "text-paper"}`}>{value}</div>
    </div>
  );
}
