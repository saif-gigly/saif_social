import type { Status } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const STYLES: Record<Status, string> = {
  posted: "bg-moss/15 text-moss",
  drafted: "bg-brass/15 text-brass",
  needs_facts: "bg-rust/15 text-rust",
  idea: "bg-smoke/15 text-smoke",
};

export default function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block font-ui text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
