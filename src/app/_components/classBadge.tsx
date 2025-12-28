import { type Student } from "~/types/utils";

export const ClassBadge = ({ cls }: { cls: Student["classes"][number] }) => (
  <div className="border-plum/10 text-ink rounded-xl border bg-white/70 px-3 py-2 text-sm shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <p className="text-plum font-semibold">{cls.className}</p>
      <p className="text-plum/80 text-xs">
        {cls.classDay
          ? new Date(cls.classDay).toLocaleDateString("es-AR")
          : "Sin fecha"}
      </p>
    </div>
    <div className="text-plum/70 mt-1 text-[11px]">
      Mes: <span className="text-ink font-semibold">{cls.monthLabel}</span>
    </div>
    <div className="mt-1 flex items-center justify-between text-xs">
      <span>
        Precio:{" "}
        <span className="text-ink font-semibold">
          ${Number(cls.classPrice).toLocaleString("es-AR")}
        </span>
      </span>
      <span
        className={`rounded-full px-2 py-0.5 font-semibold ${
          cls.classPaid
            ? "bg-primary/10 text-primary"
            : "bg-secondary/20 text-plum"
        }`}
      >
        {cls.classPaid ? "Pagado" : "Pendiente"}
      </span>
    </div>
    <div className="text-plum/80 mt-1 grid grid-cols-2 gap-1 text-[11px]">
      <span>
        Horno:{" "}
        <strong className="text-ink">
          {cls.ovenPrice ? `$${cls.ovenPrice}` : "—"}
        </strong>{" "}
        {cls.ovenPaid ? "(pagado)" : ""}
      </span>
      <span>
        Material:{" "}
        <strong className="text-ink">
          {cls.materialPrice ? `$${cls.materialPrice}` : "—"}
        </strong>{" "}
        {cls.materialPaid ? "(pagado)" : ""}
      </span>
    </div>
    <div className="text-plum/70 text-[11px]">
      Asistencia:{" "}
      <span className="text-ink font-semibold">
        {cls.assistance ? "Sí" : "No"}
      </span>
    </div>
  </div>
);
