export const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="ring-plum/10 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1">
    <p className="text-plum/70 text-xs tracking-[0.08em] uppercase">{label}</p>
    <p className="text-plum text-2xl font-semibold">{value}</p>
  </div>
);
