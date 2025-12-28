import { type RouterOutputs } from "~/trpc/react";
import { type ClassFormState, type StudentFormState } from "./students";

export const WEEK_DAYS = [
  { value: 1, label: "Lunes", aliases: ["lunes", "lun", "mon"] },
  { value: 2, label: "Martes", aliases: ["martes", "mar", "tue"] },
  { value: 3, label: "Miércoles", aliases: ["miercoles", "mié", "mie", "wed"] },
  { value: 4, label: "Jueves", aliases: ["jueves", "jue", "thu"] },
  { value: 5, label: "Viernes", aliases: ["viernes", "vie", "fri"] },
  { value: 6, label: "Sábado", aliases: ["sabado", "sáb", "sab", "sat"] },
  { value: 0, label: "Domingo", aliases: ["domingo", "dom", "sun"] },
] as const;

export type DayOption = (typeof WEEK_DAYS)[number];

export type CalendarDayKey = DayOption["value"] | "unscheduled";

export type CalendarEntry = {
  id: number;
  day: CalendarDayKey;
  dayLabel: string;
  time: string;
  student: string;
  className?: string;
  classDateLabel?: string;
};

export const emptyStudent: StudentFormState = {
  name: "",
  birthday: "",
  telephone: "",
  day: "",
  timetable: "10:30",
};

export const emptyClassDraft: ClassFormState = {
  className: "",
  classPrice: "",
  classDay: "",
  classPaid: false,
  monthId: null,
  assistance: false,
  ovenName: "",
  ovenPrice: "",
  ovenPaid: false,
  materialName: "",
  materialPrice: "",
  materialPaid: false,
};

export type Student = RouterOutputs["students"]["list"][number];

export const TIME_REGEX = /(\d{1,2}):(\d{2})/;

export const sanitizeDay = (value: string) =>
  value
    .toLowerCase()
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u");

export const getDayFromString = (value?: string): DayOption | null => {
  if (!value) return null;
  const normalized = sanitizeDay(value.trim());
  return (
    WEEK_DAYS.find((day) =>
      day.aliases.some((alias) => normalized.startsWith(alias)),
    ) ?? null
  );
};

export const parseTimeToMinutes = (time: string) => {
  const match = TIME_REGEX.exec(time);
  if (!match) return Number.POSITIVE_INFINITY;
  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  return hours * 60 + minutes;
};
