"use client";

import { showNotification } from "@mantine/notifications";
import { useMemo, useState } from "react";
import { LuPlus, LuTrash2 } from "react-icons/lu";

import { api } from "~/trpc/react";
import {
  type Student,
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

  const groupedStudents = useMemo(() => {
    if (!students) return [];
    const dayMap = new Map<
      number | "unscheduled",
      { label: string; times: Map<string, Student[]> }
    >();

    for (const student of students) {
      const preferredDay = getDayFromString(student.day ?? undefined);
      const dayKey = preferredDay?.value ?? "unscheduled";
      const dayLabel = preferredDay?.label ?? "Sin día";
      const time = student.timetable?.trim() ?? "Sin horario";

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { label: dayLabel, times: new Map() });
      }

      const dayEntry = dayMap.get(dayKey);
      if (!dayEntry) continue;
      if (!dayEntry.times.has(time)) {
        dayEntry.times.set(time, []);
      }
      dayEntry.times.get(time)?.push(student);
    }

    const baseDays = WEEK_DAYS.map((day) => ({
      key: day.value,
      label: day.label,
    }));
    const needsUnscheduled = dayMap.has("unscheduled");
    const orderedDays = needsUnscheduled
      ? [...baseDays, { key: "unscheduled" as const, label: "Sin día" }]
      : baseDays;

    return orderedDays
      .filter((day) => dayMap.has(day.key))
      .map((day) => {
        const dayEntry = dayMap.get(day.key);
        const times = Array.from(dayEntry?.times.entries() ?? []).sort(
          ([a], [b]) => parseTimeToMinutes(a) - parseTimeToMinutes(b),
        );
        return {
          key: day.key,
          label: dayEntry?.label ?? day.label,
          times: times.map(([time, list]) => ({ time, students: list })),
        };
      });
  }, [students]);

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
                    e.target.value === "10:00"
                      ? "10:00"
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
              <option key={1} value={"10:00"}>
                10:00
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
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {groupedStudents.map((dayGroup) => (
            <div key={dayGroup.label} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-full px-4 py-1 text-xs font-semibold tracking-[0.12em] uppercase">
                  {dayGroup.label}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dayGroup.times.map((timeGroup) => (
                  <div
                    key={`${dayGroup.label}-${timeGroup.time}`}
                    className="border-plum/15 rounded-2xl bg-white/85 p-4 shadow-md shadow-[#a30d0d]/15"
                  >
                    <Text className="text-plum/70 text-xs tracking-[0.12em] uppercase">
                      {dayGroup.label} {timeGroup.time}
                    </Text>
                    <div className="mt-3 flex flex-col gap-3">
                      {timeGroup.students.map((student) => (
                        <Stack
                          key={student.id}
                          className="border-plum/10 gap-3 rounded-2xl bg-white/70 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Title
                                size={"lg"}
                                className="text-plum font-semibold"
                              >
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
                                onClick={() =>
                                  deleteStudent.mutate({ id: student.id })
                                }
                                loading={deleteStudent.isPending}
                              >
                                <LuTrash2 className="h-4 w-4" />
                              </ButtonM>
                            </div>
                          </div>
                        </Stack>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!isLoading && (students?.length ?? 0) === 0 ? (
            <p className="border-plum/30 text-plum/70 rounded-2xl border border-dashed bg-white/60 p-6 text-center text-sm">
              Aún no hay alumnos cargados. Crea el primero para empezar a
              registrar clases.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
