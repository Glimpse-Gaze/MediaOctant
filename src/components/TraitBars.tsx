export function TraitBars({
  traits,
}: {
  traits: Array<{ code: string; name: string; value: number; max: number }>;
}) {
  const colors = ["#22c5c5", "#7b6cff", "#ff7a59", "#7ce38b", "#ffd166", "#5b8def", "#ff8fab", "#4dd0c6"];

  return (
    <ul className="mt-4 space-y-3">
      {traits.map((t, i) => {
        const pct = Math.max(0, Math.min(100, (t.value / t.max) * 100));
        return (
          <li key={t.code}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">
                <span className="mr-2 text-[var(--muted)]">{t.code}</span>
                {t.name}
              </span>
              <span className="tabular-nums text-[var(--muted)]">{t.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#eef3fb]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: colors[i % colors.length] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
