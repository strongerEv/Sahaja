export default function ComingSoon({
  title,
  tagline,
  features,
  note,
}: {
  title: string;
  tagline: string;
  features: Array<{ name: string; description: string }>;
  note: string;
}) {
  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-br from-brand-50 to-cream">
        <span className="badge bg-white text-brand-600">Segera hadir</span>
        <h2 className="mt-3 font-display text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{tagline}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <div key={feature.name} className="card">
            <h3 className="font-display text-xl text-brand-700">{feature.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.description}</p>
          </div>
        ))}
      </div>

      <p className="rounded-2xl border border-dashed border-line bg-white p-5 text-sm text-muted">
        {note}
      </p>
    </div>
  );
}
