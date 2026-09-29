"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { ContentItem, Status } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const STATUS_OPTIONS: Status[] = ["idea", "needs_facts", "drafted", "posted"];

export default function ContentEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/content/${params.id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setItem(data.item);
    })();
  }, [params.id]);

  async function save(patch: Partial<ContentItem>) {
    if (!item) return;
    setSaving(true);
    const res = await fetch(`/api/content/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setItem(data.item);
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-8 font-ui text-sm text-smoke">
        Not found. <Link href="/content" className="text-brass">Back to content</Link>
      </div>
    );
  }

  if (!item) {
    return <div className="max-w-3xl mx-auto px-8 py-8 font-ui text-sm text-smoke">Loading…</div>;
  }

  const contentFont = item.language === "bn" ? "font-content-bn" : "font-content-en";

  return (
    <div className="max-w-3xl mx-auto px-8 py-8">
      <button
        onClick={() => router.push("/content")}
        className="font-ui text-xs text-smoke hover:text-paper mb-4"
      >
        ← Back to content
      </button>

      <div className="flex items-center justify-between mb-1 gap-3">
        <input
          value={item.title}
          onChange={(e) => setItem({ ...item, title: e.target.value })}
          onBlur={() => save({ title: item.title })}
          className={`text-xl font-semibold bg-transparent border-0 px-0 focus:outline-none w-full ${contentFont}`}
        />
      </div>
      <div className="font-ui text-[11px] text-smoke mb-5">
        {item.type} · updated {new Date(item.updatedAt).toLocaleString()}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <label className="font-ui text-xs text-smoke">Status</label>
        <select
          value={item.status}
          onChange={(e) => {
            const status = e.target.value as Status;
            setItem({ ...item, status });
            save({ status });
          }}
          className="font-ui text-xs px-2.5 py-1.5"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {saving && <span className="font-ui text-xs text-smoke">Saving…</span>}
        {savedFlash && !saving && <span className="font-ui text-xs text-moss">Saved</span>}
      </div>

      <label className="block font-ui text-[11px] uppercase tracking-wide text-smoke mb-1.5">
        Notes
      </label>
      <textarea
        value={item.notes}
        onChange={(e) => setItem({ ...item, notes: e.target.value })}
        onBlur={() => save({ notes: item.notes })}
        rows={3}
        className="w-full font-ui text-[13px] px-3 py-2.5 mb-6"
      />

      <label className="block font-ui text-[11px] uppercase tracking-wide text-smoke mb-1.5">
        Text
      </label>
      <textarea
        value={item.text}
        onChange={(e) => setItem({ ...item, text: e.target.value })}
        onBlur={() => save({ text: item.text })}
        rows={18}
        placeholder="No text yet — write or paste a draft here."
        className={`w-full text-[15px] px-3 py-3 ${contentFont}`}
      />
    </div>
  );
}
