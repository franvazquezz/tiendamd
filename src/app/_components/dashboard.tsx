"use client";

import { showNotification } from "@mantine/notifications";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";

import { api } from "~/trpc/react";
import {
  type CalendarDayKey,
  type CalendarEntry,
  emptyStudent,
  getDayFromString,
  parseTimeToMinutes,
  WEEK_DAYS,
} from "~/types/utils";
import { StatCard } from "./statCard";
import { ButtonM } from "./button";
import Link from "next/link";
import { Flex, Stack, Text, Title } from "@mantine/core";

export function Dashboard() {
  const [search, setSearch] = useState("");
  const [studentForm, setStudentForm] = useState({ ...emptyStudent });
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const utils = api.useUtils();
  const { data: students, isLoading } = api.students.list.useQuery(
    { search: search.trim() ?? undefined },
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
      showNotification({
        title: "Alumno creado",
        color: "green",
        message: "El alumno fue creado exitosamente",
      });
    },
    onError: () =>
      showNotification({ color: "red", message: "No se pudo crear el alumno" }),
  });

  const deleteStudent = api.students.delete.useMutation({
    onSuccess: async () => {
      await utils.students.list.invalidate();
      showNotification({ color: "green", message: "Alumno eliminado" });
    },
    onError: () =>
      showNotification({
        color: "red",
        message: "No se pudo eliminar el alumno",
      }),
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    createStudent.mutate({
      ...studentForm,
      birthday: studentForm.birthday ?? undefined,
      telephone: studentForm.telephone ?? undefined,
      day: studentForm.day ?? undefined,
      timetable: studentForm.timetable ?? undefined,
    });
  };

  const calendarEntries = useMemo<CalendarEntry[]>(() => {
    if (!students) return [];
    return students.map((student) => {
      const preferredDay = getDayFromString(student.day ?? undefined);
      return {
        day: preferredDay?.value ?? "unscheduled",
        dayLabel: preferredDay?.label ?? "Sin día",
        time: student.timetable?.trim() ?? "Sin horario",
        student: student.name,
        id: student.id,
      };
    });
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
          <ButtonM
            type="button"
            variant="ghost"
            onClick={() => setShowCreateStudent((prev) => !prev)}
          >
            {showCreateStudent ? "Ocultar" : "Mostrar"} formulario
          </ButtonM>
        </div>
        {showCreateStudent ? (
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
            <select
              value={studentForm.timetable}
              onChange={(e) =>
                setStudentForm({
                  ...studentForm,
                  timetable:
                    e.target.value === "10:30"
                      ? "10:30"
                      : e.target.value === "16:00"
                        ? "16:00"
                        : e.target.value === "18:30"
                          ? "18:30"
                          : undefined,
                })
              }
              className="border-plum/20 text-ink ring-primary/20 rounded-xl border bg-white/80 px-4 py-2 text-sm transition outline-none focus:ring-2"
            >
              <option value="">Seleccionar horario</option>
              <option key={1} value={"10:30"}>
                10:30
              </option>
              <option key={2} value={"16:00"}>
                16:00
              </option>
              <option key={3} value={"18:30"}>
                18:30
              </option>
            </select>
            <div className="flex items-center justify-end sm:col-span-2">
              <ButtonM type="submit" loading={createStudent.isPending}>
                <LuPlus className="h-4 w-4" />
                Crear alumno
              </ButtonM>
            </div>
          </form>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-plum/70 text-xs tracking-[0.12em] uppercase">
              Alumnos
            </p>
            <h2 className="text-plum text-2xl font-semibold">Listado</h2>
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
                          <Flex
                            key={`${time}-${day.value}`}
                            className="border-plum/5 min-h-24 border-l px-3 py-2"
                            justify={"space-around"}
                          >
                            {matches.length === 0 ? (
                              <Text className="text-plum/40 text-xs">—</Text>
                            ) : (
                              <Stack gap={"md"} justify="space-around">
                                {matches.map((match, idx) => (
                                  <Flex
                                    key={`${match.student}-${match.time}-${idx}`}
                                    className="border-plum/20 bg-primary/5 text-plum rounded-lg border px-3 py-2 text-xs shadow-sm"
                                  >
                                    <Text className="text-plum text-sm font-semibold">
                                      <Link href={`/students/${match.id}`}>
                                        {match.student}
                                      </Link>
                                    </Text>
                                  </Flex>
                                ))}
                              </Stack>
                            )}
                          </Flex>
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
              return (
                <Stack
                  key={student.id}
                  className="border-plum/15 gap-4 rounded-2xl bg-white/85 p-4 shadow-md shadow-[#a30d0d]/15"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Title size={"xl"} className="text-plum font-semibold">
                        {student.name}
                      </Title>
                      <Text className="text-plum/70 text-xs">
                        {student.day
                          ? `Día: ${student.day}`
                          : "Sin día asignado"}
                      </Text>
                      <Text className="text-plum/60 text-xs">
                        {student.classes.length} clases
                      </Text>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/students/${student.id}`}
                        className="border-plum/20 text-plum hover:border-plum/40 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5"
                      >
                        Ver detalle
                      </Link>
                      <ButtonM
                        variant="danger"
                        onClick={() => deleteStudent.mutate({ id: student.id })}
                        loading={deleteStudent.isPending}
                      >
                        <LuTrash2 className="h-4 w-4" />
                      </ButtonM>
                    </div>
                  </div>
                </Stack>
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
