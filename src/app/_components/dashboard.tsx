"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LuLoader2, LuPlus, LuTrash2 } from "react-icons/lu";

import { api, type RouterOutputs } from "~/trpc/react";

type Student = RouterOutputs["students"]["list"][number];

type ClassDraft = {
  className: string;
  classPrice: string;
  classDay: string;
  classPaid: boolean;
};

const emptyStudent = {
  name: "",
  birthday: "",
  telephone: "",
  day: "",
  timetable: "",
};

const emptyClassDraft: ClassDraft = {
  className: "",
  classPrice: "",
  classDay: "",
  classPaid: false,
};

const WEEK_DAYS = [
  { value: 1, label: "Lunes", aliases: ["lunes", "lun", "mon"] },
  { value: 2, label: "Martes", aliases: ["martes", "mar", "tue"] },
  { value: 3, label: "Miércoles", aliases: ["miercoles", "mié", "mie", "wed"] },
  { value: 4, label: "Jueves", aliases: ["jueves", "jue", "thu"] },
  { value: 5, label: "Viernes", aliases: ["viernes", "vie", "fri"] },
  { value: 6, label: "Sábado", aliases: ["sabado", "sáb", "sab", "sat"] },
  { value: 0, label: "Domingo", aliases: ["domingo", "dom", "sun"] },
] as const;

type DayOption = (typeof WEEK_DAYS)[number];
type CalendarDayKey = DayOption["value"] | "unscheduled";
type CalendarEntry = {
  day: CalendarDayKey;
  dayLabel: string;
  time: string;
  student: string;
  className?: string;
  classDateLabel?: string;
};

const TIME_REGEX = /(\d{1,2}):(\d{2})/;

const Button = ({
  children,
  variant = "primary",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  children: ReactNode;
}) => {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all";
  const variants: Record<"primary" | "ghost" | "danger", string> = {
    primary:
      "bg-primary text-sand shadow-[0_10px_30px_rgba(163,13,13,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(163,13,13,0.35)]",
    ghost: "border border-plum/10 text-plum hover:bg-plum/10",
    danger:
      "bg-plum text-sand hover:-translate-y-0.5 shadow-[0_10px_30px_rgba(88,43,57,0.3)]",
  };

  return (
    <button
      className={`${base} ${variants[variant]}`}
      disabled={loading}
      {...props}
    >
      {loading ? <LuLoader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="ring-plum/10 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1">
    <p className="text-plum/70 text-xs tracking-[0.08em] uppercase">{label}</p>
    <p className="text-plum text-2xl font-semibold">{value}</p>
  </div>
);

const ClassBadge = ({ cls }: { cls: Student["classes"][number] }) => (
  <div className="border-plum/10 text-ink rounded-xl border bg-white/70 px-3 py-2 text-sm shadow-sm">
    <div className="flex items-center justify-between gap-2">
      <p className="text-plum font-semibold">{cls.className}</p>
      <p className="text-plum/80 text-xs">
        {cls.classDay
          ? new Date(cls.classDay).toLocaleDateString("es-AR")
          : "Sin fecha"}
      </p>
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
  </div>
);

const sanitizeDay = (value: string) =>
  value
    .toLowerCase()
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u");

const getDayFromString = (value?: string): DayOption | null => {
  if (!value) return null;
  const normalized = sanitizeDay(value.trim());
  return (
    WEEK_DAYS.find((day) =>
      day.aliases.some((alias) => normalized.startsWith(alias)),
    ) ?? null
  );
};

const parseTimeToMinutes = (time: string) => {
  const match = TIME_REGEX.exec(time);
  if (!match) return Number.POSITIVE_INFINITY;
  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  return hours * 60 + minutes;
};

export function Dashboard() {
  const [search, setSearch] = useState("");
  const [studentForm, setStudentForm] = useState({ ...emptyStudent });
  const [classDrafts, setClassDrafts] = useState<Record<string, ClassDraft>>(
    {},
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const utils = api.useUtils();
  const { data: students, isLoading } = api.students.list.useQuery(
    { search: search.trim() || undefined },
    { refetchOnWindowFocus: false },
  );

  const stats = useMemo(() => {
    const totalStudents = students?.length ?? 0;
    const totalClasses =
      students?.reduce((sum, student) => sum + student.classes.length, 0) ?? 0;
    return {
      totalStudents,
      totalClasses,
    };
  }, [students]);

  const createStudent = api.students.create.useMutation({
    onSuccess: async () => {
      await utils.students.list.invalidate();
      setStudentForm({ ...emptyStudent });
    },
  });

  const deleteStudent = api.students.delete.useMutation({
    onSuccess: async () => {
      await utils.students.list.invalidate();
    },
  });

  const addClass = api.students.addClass.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.students.list.invalidate();
      setClassDrafts((prev) => ({
        ...prev,
        [variables.studentId]: { ...emptyClassDraft },
      }));
    },
  });

  const deleteClass = api.students.deleteClass.useMutation({
    onSuccess: async () => {
      await utils.students.list.invalidate();
    },
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    createStudent.mutate({
      ...studentForm,
      birthday: studentForm.birthday || undefined,
      telephone: studentForm.telephone || undefined,
      day: studentForm.day || undefined,
      timetable: studentForm.timetable || undefined,
    });
  };

  const handleAddClass = (studentId: string) => {
    const draft = classDrafts[studentId] ?? emptyClassDraft;
    if (!draft.className || !draft.classPrice) return;
    addClass.mutate({
      studentId,
      className: draft.className,
      classPrice: Number(draft.classPrice),
      classDay: draft.classDay
        ? new Date(draft.classDay).toISOString()
        : undefined,
      classPaid: draft.classPaid,
    });
  };

  const calendarEntries = useMemo<CalendarEntry[]>(() => {
    const entries: CalendarEntry[] = [];

    students?.forEach((student) => {
      const fallbackDay = getDayFromString(student.day ?? undefined);
      const fallbackTime = student.timetable?.trim() ?? "Sin horario";

      if (student.classes.length === 0) {
        entries.push({
          day: fallbackDay?.value ?? "unscheduled",
          dayLabel: fallbackDay?.label ?? "Sin día",
          time: fallbackTime,
          student: student.name,
        });
        return;
      }

      student.classes.forEach((cls) => {
        const classDate = cls.classDay ? new Date(cls.classDay) : null;
        const mappedDay = classDate
          ? (WEEK_DAYS.find((day) => day.value === classDate.getDay()) ?? null)
          : fallbackDay;

        entries.push({
          day: mappedDay?.value ?? "unscheduled",
          dayLabel: mappedDay?.label ?? "Sin día",
          time: classDate
            ? classDate.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : fallbackTime,
          student: student.name,
          className: cls.className,
          classDateLabel: classDate
            ? classDate.toLocaleDateString("es-AR")
            : undefined,
        });
      });
    });

    return entries;
  }, [students]);

  const calendarTimes = useMemo(() => {
    const times = Array.from(
      new Set(calendarEntries.map((entry) => entry.time)),
    );
    return times.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
  }, [calendarEntries]);

  const calendarDays = useMemo<
    Array<{ value: CalendarDayKey; label: string }>
  >(() => {
    const needsUnscheduled = calendarEntries.some(
      (entry) => entry.day === "unscheduled",
    );
    const base = WEEK_DAYS.map((day) => ({
      value: day.value,
      label: day.label,
    }));
    return needsUnscheduled
      ? [...base, { value: "unscheduled", label: "Sin día" }]
      : base;
  }, [calendarEntries]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="from-primary via-plum to-secondary overflow-hidden rounded-3xl bg-linear-to-r p-px shadow-xl">
        <div className="bg-sand/95 flex flex-col gap-6 rounded-[28px] px-8 py-10">
          <p className="text-plum/70 text-sm tracking-[0.12em] uppercase">
            MD Cerámica
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-plum text-3xl font-black sm:text-4xl">
                Dashboard de alumnos y clases
              </h1>
              <p className="text-plum/80 mt-2 text-sm">
                Controla alumnos, pagos y cronograma en un único panel, ahora
                con stack Next.js + tRPC + Prisma.
              </p>
            </div>
            <div className="flex gap-3">
              <StatCard
                label="Alumnos activos"
                value={stats.totalStudents.toString()}
              />
              <StatCard
                label="Clases cargadas"
                value={stats.totalClasses.toString()}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alumno..."
              className="border-plum/20 text-ink ring-primary/20 w-full rounded-xl border bg-white/80 px-4 py-2 text-sm transition outline-none focus:ring-2"
            />
          </div>
        </div>
      </section>

      <section className="ring-plum/10 grid gap-6 rounded-3xl bg-white/80 p-6 shadow-lg ring-1 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <p className="text-plum/70 text-xs tracking-[0.12em] uppercase">
            Nuevo alumno
          </p>
          <h2 className="text-plum text-2xl font-semibold">Registrar</h2>
          <p className="text-plum/80 text-sm">
            Crea alumnos con su información básica. Los nombres se guardan
            capitalizados automáticamente.
          </p>
        </div>
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={handleCreateStudent}
        >
          <input
            required
            value={studentForm.name}
            onChange={(e) =>
              setStudentForm({ ...studentForm, name: e.target.value })
            }
            placeholder="Nombre completo"
            className="border-plum/20 text-ink ring-primary/20 rounded-xl border bg-white/80 px-4 py-2 text-sm transition outline-none focus:ring-2"
          />
          <input
            type="date"
            value={studentForm.birthday}
            onChange={(e) =>
              setStudentForm({ ...studentForm, birthday: e.target.value })
            }
            className="border-plum/20 text-ink ring-primary/20 rounded-xl border bg-white/80 px-4 py-2 text-sm transition outline-none focus:ring-2"
          />
          <input
            value={studentForm.telephone}
            onChange={(e) =>
              setStudentForm({ ...studentForm, telephone: e.target.value })
            }
            placeholder="Teléfono"
            className="border-plum/20 text-ink ring-primary/20 rounded-xl border bg-white/80 px-4 py-2 text-sm transition outline-none focus:ring-2"
          />
          <input
            value={studentForm.day}
            onChange={(e) =>
              setStudentForm({ ...studentForm, day: e.target.value })
            }
            placeholder="Día preferido"
            className="border-plum/20 text-ink ring-primary/20 rounded-xl border bg-white/80 px-4 py-2 text-sm transition outline-none focus:ring-2"
          />
          <input
            value={studentForm.timetable}
            onChange={(e) =>
              setStudentForm({ ...studentForm, timetable: e.target.value })
            }
            placeholder="Horario"
            className="border-plum/20 text-ink ring-primary/20 rounded-xl border bg-white/80 px-4 py-2 text-sm transition outline-none focus:ring-2"
          />
          <div className="flex items-center justify-end sm:col-span-2">
            <Button type="submit" loading={createStudent.isPending}>
              <LuPlus className="h-4 w-4" />
              Crear alumno
            </Button>
          </div>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-plum/70 text-xs tracking-[0.12em] uppercase">
              Alumnos
            </p>
            <h2 className="text-plum text-2xl font-semibold">
              Listado y clases
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && <p className="text-plum/60 text-sm">Cargando...</p>}
            <div className="border-plum/15 bg-plum/5 flex items-center gap-2 rounded-full border p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "text-plum ring-plum/20 bg-white shadow-sm ring-1"
                    : "text-plum/70 hover:text-plum"
                }`}
              >
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "calendar"
                    ? "text-plum ring-plum/20 bg-white shadow-sm ring-1"
                    : "text-plum/70 hover:text-plum"
                }`}
              >
                Calendario
              </button>
            </div>
          </div>
        </div>

        {viewMode === "calendar" ? (
          <div className="border-plum/15 rounded-2xl border bg-white/90 p-4 shadow-md">
            {calendarEntries.length === 0 && !isLoading ? (
              <p className="text-plum/70 text-sm">
                No hay alumnos o clases para mostrar en el calendario todavía.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-240">
                  <div
                    className="border-plum/10 bg-plum/5 text-plum/80 grid border-b text-xs font-semibold tracking-[0.08em] uppercase"
                    style={{
                      gridTemplateColumns: `140px repeat(${calendarDays.length}, minmax(0,1fr))`,
                    }}
                  >
                    <div className="px-3 py-3">Horario</div>
                    {calendarDays.map((day) => (
                      <div
                        key={day.value}
                        className="border-plum/10 border-l px-3 py-3 text-center"
                      >
                        {day.label}
                      </div>
                    ))}
                  </div>
                  {calendarTimes.map((time) => (
                    <div
                      key={time}
                      className="border-plum/5 grid border-b last:border-b-0"
                      style={{
                        gridTemplateColumns: `140px repeat(${calendarDays.length}, minmax(0,1fr))`,
                      }}
                    >
                      <div className="border-plum/5 bg-plum/5 text-plum border-r px-3 py-3 text-sm font-semibold">
                        {time}
                      </div>
                      {calendarDays.map((day) => {
                        const matches = calendarEntries.filter(
                          (entry) =>
                            entry.day === day.value && entry.time === time,
                        );
                        return (
                          <div
                            key={`${time}-${day.value}`}
                            className="border-plum/5 min-h-24 border-l px-3 py-2"
                          >
                            {matches.length === 0 ? (
                              <p className="text-plum/40 text-xs">—</p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {matches.map((match, idx) => (
                                  <div
                                    key={`${match.student}-${match.className ?? "sin-clase"}-${idx}`}
                                    className="border-plum/20 bg-primary/5 text-plum rounded-lg border px-3 py-2 text-xs shadow-sm"
                                  >
                                    <p className="text-plum text-sm font-semibold">
                                      {match.student}
                                    </p>
                                    <p className="text-plum/70 text-[11px]">
                                      {match.className
                                        ? `Clase: ${match.className}`
                                        : "Sin clase asociada"}
                                    </p>
                                    {match.classDateLabel ? (
                                      <p className="text-plum/60 text-[11px]">
                                        Fecha: {match.classDateLabel}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {students?.map((student) => {
              const draft = classDrafts[student.id] ?? emptyClassDraft;
              return (
                <article
                  key={student.id}
                  className="border-plum/15 flex flex-col gap-4 rounded-2xl border bg-white/85 p-4 shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-plum text-lg font-semibold">
                        {student.name}
                      </h3>
                      <p className="text-plum/70 text-xs">
                        {student.day
                          ? `Día: ${student.day}`
                          : "Sin día asignado"}
                      </p>
                      {student.telephone ? (
                        <p className="text-plum/70 text-xs">
                          Tel: {student.telephone}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/students/${student.id}`}
                        className="border-plum/20 text-plum hover:border-plum/40 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5"
                      >
                        Ver detalle
                      </Link>
                      <Button
                        variant="danger"
                        onClick={() => deleteStudent.mutate({ id: student.id })}
                        loading={deleteStudent.isPending}
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-plum/70 text-xs tracking-widest uppercase">
                      Clases
                    </p>
                    <div className="flex flex-col gap-2">
                      {student.classes.length === 0 ? (
                        <p className="text-plum/60 text-sm">
                          Sin clases asociadas aún.
                        </p>
                      ) : (
                        student.classes.map((cls) => (
                          <div key={cls.id} className="flex items-start gap-3">
                            <ClassBadge cls={cls} />
                            <Button
                              variant="ghost"
                              onClick={() =>
                                deleteClass.mutate({ classId: cls.id })
                              }
                              loading={deleteClass.isPending}
                            >
                              <LuTrash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-secondary/40 bg-secondary/10 rounded-xl border p-3">
                    <p className="text-plum/70 text-xs tracking-widest uppercase">
                      Agregar clase
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input
                        value={draft.className}
                        onChange={(e) =>
                          setClassDrafts((prev) => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] ?? emptyClassDraft),
                              className: e.target.value,
                            },
                          }))
                        }
                        placeholder="Nombre"
                        className="border-plum/20 text-ink ring-primary/20 rounded-lg border bg-white px-3 py-2 text-sm transition outline-none focus:ring-2"
                      />
                      <input
                        type="number"
                        value={draft.classPrice}
                        onChange={(e) =>
                          setClassDrafts((prev) => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] ?? emptyClassDraft),
                              classPrice: e.target.value,
                            },
                          }))
                        }
                        placeholder="Precio"
                        className="border-plum/20 text-ink ring-primary/20 rounded-lg border bg-white px-3 py-2 text-sm transition outline-none focus:ring-2"
                      />
                      <input
                        type="date"
                        value={draft.classDay}
                        onChange={(e) =>
                          setClassDrafts((prev) => ({
                            ...prev,
                            [student.id]: {
                              ...(prev[student.id] ?? emptyClassDraft),
                              classDay: e.target.value,
                            },
                          }))
                        }
                        className="border-plum/20 text-ink ring-primary/20 rounded-lg border bg-white px-3 py-2 text-sm transition outline-none focus:ring-2"
                      />
                      <label className="text-plum flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={draft.classPaid}
                          onChange={(e) =>
                            setClassDrafts((prev) => ({
                              ...prev,
                              [student.id]: {
                                ...(prev[student.id] ?? emptyClassDraft),
                                classPaid: e.target.checked,
                              },
                            }))
                          }
                          className="border-plum/30 text-primary focus:ring-primary h-4 w-4 rounded"
                        />
                        Pagado
                      </label>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        onClick={() => handleAddClass(student.id)}
                        loading={addClass.isPending}
                        type="button"
                      >
                        <LuPlus className="h-4 w-4" />
                        Guardar clase
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
            {!isLoading && (students?.length ?? 0) === 0 ? (
              <p className="border-plum/30 text-plum/70 rounded-2xl border border-dashed bg-white/60 p-6 text-center text-sm">
                Aún no hay alumnos cargados. Crea el primero para empezar a
                registrar clases.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
