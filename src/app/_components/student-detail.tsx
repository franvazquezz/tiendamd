"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LuArrowLeft, LuLoader2, LuPlus, LuSave } from "react-icons/lu";

import { api, type RouterOutputs } from "~/trpc/react";

type Student = NonNullable<RouterOutputs["students"]["byId"]>;
type ClassDraft = {
  className: string;
  classPrice: string;
  classDay: string;
  classPaid: boolean;
};

const Button = ({
  children,
  variant = "primary",
  loading = false,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  loading?: boolean;
}) => {
  const base =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all disabled:opacity-60";
  const variants: Record<"primary" | "ghost", string> = {
    primary:
      "bg-primary text-sand shadow-[0_10px_30px_rgba(163,13,13,0.3)] hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(163,13,13,0.35)]",
    ghost: "border border-plum/20 text-plum hover:bg-plum/5",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading} {...props}>
      {loading ? <LuLoader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
};

export function StudentDetail({ id }: { id: string }) {
  const utils = api.useUtils();
  const { data, isLoading } = api.students.byId.useQuery({ id });

  const [form, setForm] = useState({
    name: "",
    birthday: "",
    telephone: "",
    day: "",
    timetable: "",
  });

  const [classDrafts, setClassDrafts] = useState<Record<string, ClassDraft>>({});
  const [newClass, setNewClass] = useState<ClassDraft>({
    className: "",
    classPrice: "",
    classDay: "",
    classPaid: false,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name ?? "",
      birthday: data.birthday ? new Date(data.birthday).toISOString().slice(0, 10) : "",
      telephone: data.telephone ?? "",
      day: data.day ?? "",
      timetable: data.timetable ?? "",
    });
    const drafts: Record<string, ClassDraft> = {};
    data.classes.forEach((cls) => {
      drafts[cls.id] = {
        className: cls.className ?? "",
        classPrice: cls.classPrice ? String(cls.classPrice) : "",
        classDay: cls.classDay ? new Date(cls.classDay).toISOString().slice(0, 10) : "",
        classPaid: Boolean(cls.classPaid),
      };
    });
    setClassDrafts(drafts);
  }, [data?.id, data]);

  const updateStudent = api.students.update.useMutation({
    onSuccess: async () => {
      await utils.students.byId.invalidate({ id });
      await utils.students.list.invalidate();
    },
  });

  const updateClass = api.students.updateClass.useMutation({
    onSuccess: async () => {
      await utils.students.byId.invalidate({ id });
      await utils.students.list.invalidate();
    },
  });

  const addClass = api.students.addClass.useMutation({
    onSuccess: async (_data, variables) => {
      await utils.students.byId.invalidate({ id });
      await utils.students.list.invalidate();
      setNewClass({
        className: "",
        classPrice: "",
        classDay: "",
        classPaid: false,
      });
      // reset any draft created for new class id
      setClassDrafts((prev) => ({
        ...prev,
        [variables.studentId]: {
          className: "",
          classPrice: "",
          classDay: "",
          classPaid: false,
        },
      }));
    },
  });

  const studentStats = useMemo(() => {
    if (!data) return null;
    const totalAmount = data.classes.reduce(
      (sum, cls) => sum + Number(cls.classPrice ?? 0),
      0
    );
    const paidAmount = data.classes
      .filter((cls) => cls.classPaid)
      .reduce((sum, cls) => sum + Number(cls.classPrice ?? 0), 0);
    const pendingAmount = totalAmount - paidAmount;
    return {
      classes: data.classes.length,
      paid: data.classes.filter((cls) => cls.classPaid).length,
      pending: data.classes.filter((cls) => !cls.classPaid).length,
      totalAmount,
      paidAmount,
      pendingAmount,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-10 text-plum">
        <LuLoader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Cargando alumno...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-plum/20 bg-white/80 p-6 text-center text-plum">
        <p className="text-lg font-semibold">Alumno no encontrado</p>
        <Link href="/" className="mt-4 inline-block text-primary underline">
          Volver al dashboard
        </Link>
      </div>
    );
  }

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudent.mutate({
      id,
      name: form.name || undefined,
      birthday: form.birthday || undefined,
      telephone: form.telephone || undefined,
      day: form.day || undefined,
      timetable: form.timetable || undefined,
    });
  };

  const handleSaveClass = (classId: string) => {
    const draft = classDrafts[classId];
    if (!draft) return;
    updateClass.mutate({
      classId,
      className: draft.className,
      classPrice: Number(draft.classPrice || 0),
      classDay: draft.classDay ? new Date(draft.classDay).toISOString() : undefined,
      classPaid: draft.classPaid,
    });
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.className || !newClass.classPrice) return;
    addClass.mutate({
      studentId: id,
      className: newClass.className,
      classPrice: Number(newClass.classPrice),
      classDay: newClass.classDay ? new Date(newClass.classDay).toISOString() : undefined,
      classPaid: newClass.classPaid,
    });
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-plum transition hover:text-primary"
        >
          <LuArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <p className="text-xs uppercase tracking-[0.12em] text-plum/70">Alumno</p>
      </div>

      <div className="rounded-3xl bg-white/85 p-6 shadow-lg ring-1 ring-plum/10">
        <div className="flex flex-col gap-2 border-b border-plum/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-plum/70">Detalles</p>
            <h1 className="text-3xl font-black text-plum">{data.name}</h1>
          </div>
          {studentStats ? (
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <span className="rounded-xl bg-primary/10 px-3 py-2 font-semibold text-primary">
                Clases: {studentStats.classes}
              </span>
              <span className="rounded-xl bg-secondary/20 px-3 py-2 font-semibold text-plum">
                Pagadas: {studentStats.paid}
              </span>
              <span className="rounded-xl bg-white px-3 py-2 font-semibold text-plum/70 ring-1 ring-plum/15">
                Pendientes: {studentStats.pending}
              </span>
              <span className="rounded-xl bg-white px-3 py-2 font-semibold text-plum/80 ring-1 ring-plum/10">
                $ Total: {studentStats.totalAmount.toLocaleString("es-AR")}
              </span>
              <span className="rounded-xl bg-white px-3 py-2 font-semibold text-primary/80 ring-1 ring-primary/20">
                $ Pagado: {studentStats.paidAmount.toLocaleString("es-AR")}
              </span>
              <span className="rounded-xl bg-white px-3 py-2 font-semibold text-plum/70 ring-1 ring-plum/15">
                $ Pendiente: {studentStats.pendingAmount.toLocaleString("es-AR")}
              </span>
            </div>
          ) : null}
        </div>

        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSaveStudent}>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre completo"
            className="rounded-xl border border-plum/20 bg-white px-4 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className="rounded-xl border border-plum/20 bg-white px-4 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <input
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
            placeholder="Teléfono"
            className="rounded-xl border border-plum/20 bg-white px-4 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <input
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
            placeholder="Día preferido"
            className="rounded-xl border border-plum/20 bg-white px-4 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <input
            value={form.timetable}
            onChange={(e) => setForm({ ...form, timetable: e.target.value })}
            placeholder="Horario"
            className="rounded-xl border border-plum/20 bg-white px-4 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" loading={updateStudent.isPending}>
              <LuSave className="h-4 w-4" />
              Guardar alumno
            </Button>
          </div>
        </form>
      </div>

      <section className="space-y-4 rounded-3xl bg-white/85 p-6 shadow-lg ring-1 ring-plum/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-plum/70">Clases</p>
            <h2 className="text-2xl font-semibold text-plum">Clases del alumno</h2>
          </div>
          {updateClass.isPending ? (
            <span className="text-xs text-plum/70">Guardando cambios...</span>
          ) : null}
        </div>

        <form
          className="grid grid-cols-1 gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4 md:grid-cols-5"
          onSubmit={handleAddClass}
        >
          <div className="md:col-span-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-plum">Agregar nueva clase</p>
            {addClass.isPending ? (
              <span className="text-xs text-plum/60">Guardando...</span>
            ) : null}
          </div>
          <input
            value={newClass.className}
            onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
            placeholder="Nombre"
            className="rounded-lg border border-plum/20 bg-white px-3 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <input
            type="number"
            value={newClass.classPrice}
            onChange={(e) => setNewClass({ ...newClass, classPrice: e.target.value })}
            placeholder="Precio"
            className="rounded-lg border border-plum/20 bg-white px-3 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <input
            type="date"
            value={newClass.classDay}
            onChange={(e) => setNewClass({ ...newClass, classDay: e.target.value })}
            className="rounded-lg border border-plum/20 bg-white px-3 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
          />
          <label className="flex items-center gap-2 text-sm text-plum">
            <input
              type="checkbox"
              checked={newClass.classPaid}
              onChange={(e) => setNewClass({ ...newClass, classPaid: e.target.checked })}
              className="h-4 w-4 rounded border-plum/30 text-primary focus:ring-primary"
            />
            Pagado
          </label>
          <div className="flex items-center justify-end">
            <Button type="submit" variant="ghost" loading={addClass.isPending}>
              <LuPlus className="h-4 w-4" />
              Guardar clase
            </Button>
          </div>
        </form>

        {data.classes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-plum/20 bg-white/70 p-4 text-sm text-plum/70">
            Este alumno aún no tiene clases cargadas.
          </p>
        ) : (
          <div className="grid gap-4">
            {data.classes.map((cls) => {
              const draft = classDrafts[cls.id] ?? {
                className: "",
                classPrice: "",
                classDay: "",
                classPaid: false,
              };
              return (
                <div
                  key={cls.id}
                  className="rounded-2xl border border-plum/15 bg-secondary/10 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-plum">{cls.className}</h3>
                    <span className="text-xs text-plum/60">
                      Creado el {new Date(cls.createdAt).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <input
                      value={draft.className}
                      onChange={(e) =>
                        setClassDrafts((prev) => ({
                          ...prev,
                          [cls.id]: { ...(prev[cls.id] ?? draft), className: e.target.value },
                        }))
                      }
                      placeholder="Nombre"
                      className="rounded-lg border border-plum/20 bg-white px-3 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
                    />
                    <input
                      type="number"
                      value={draft.classPrice}
                      onChange={(e) =>
                        setClassDrafts((prev) => ({
                          ...prev,
                          [cls.id]: { ...(prev[cls.id] ?? draft), classPrice: e.target.value },
                        }))
                      }
                      placeholder="Precio"
                      className="rounded-lg border border-plum/20 bg-white px-3 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
                    />
                    <input
                      type="date"
                      value={draft.classDay}
                      onChange={(e) =>
                        setClassDrafts((prev) => ({
                          ...prev,
                          [cls.id]: { ...(prev[cls.id] ?? draft), classDay: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-plum/20 bg-white px-3 py-2 text-sm text-ink outline-none ring-primary/20 transition focus:ring-2"
                    />
                    <label className="flex items-center gap-2 text-sm text-plum">
                      <input
                        type="checkbox"
                        checked={draft.classPaid}
                        onChange={(e) =>
                          setClassDrafts((prev) => ({
                            ...prev,
                            [cls.id]: { ...(prev[cls.id] ?? draft), classPaid: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-plum/30 text-primary focus:ring-primary"
                      />
                      Pagado
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      loading={updateClass.isPending}
                      onClick={() => handleSaveClass(cls.id)}
                    >
                      <LuSave className="h-4 w-4" />
                      Guardar clase
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
