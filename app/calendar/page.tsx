export default function CalendarPage() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-8">
      <h1 className="font-ui text-2xl font-semibold text-paper mb-1">Calendar</h1>
      <p className="font-ui text-xs text-smoke mb-6">
        Scheduled posts will appear here once the Facebook API is connected and posts can be
        queued with a publish time. For now, tracking stays in Content — mark items Posted as
        they go live.
      </p>
      <div className="bg-card border border-border rounded-lg p-10 text-center">
        <div className="font-ui text-sm text-smoke">No scheduling yet</div>
      </div>
    </div>
  );
}
