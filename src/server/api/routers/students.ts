import { Prisma } from "@prisma/client";
import type { Timetable } from "@prisma/client";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  deleteClassInput,
  monthInput,
  newClassInput,
  studentCreateInput,
  studentIdInput,
  studentSearchInput,
  studentUpdateInput,
  updateClassInput,
} from "~/types/students";
import type { StudentWithMonths } from "~/types/students";

// Map between Prisma enum names and the readable timetable strings used by
// the frontend and zod validation. Prisma enum values are defined in
// prisma/schema.prisma as: TEN @map("10:00"), SIXTEEN @map("16:00"),
// EIGHTEEN @map("18:30"). The Prisma client will expose the enum *names*
// (TEN, SIXTEEN, EIGHTEEN) in JS, so we translate back and forth.
const TIMETABLE_MAP: Record<string, string> = {
  TEN: "10:00",
  SIXTEEN: "16:00",
  EIGHTEEN: "18:30",
};

const timetableNameToValue = (name?: string | null) => {
  if (!name) return undefined;
  return TIMETABLE_MAP[name] ?? undefined;
};

const timetableValueToName = (value?: string | null) => {
  if (!value) return undefined;
  const entry = Object.entries(TIMETABLE_MAP).find(([, v]) => v === value);
  return entry ? entry[0] : undefined;
};

const DAY_ORDER = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

const TIMETABLE_ORDER = ["10:00", "16:00", "18:30"];

const normalizeDay = (value?: string | null) =>
  value
    ? value
        .trim()
        .toLowerCase()
        .replace(/á/g, "a")
        .replace(/é/g, "e")
        .replace(/í/g, "i")
        .replace(/ó/g, "o")
        .replace(/ú/g, "u")
    : "";

const getDayRank = (value?: string | null) => {
  const index = DAY_ORDER.indexOf(normalizeDay(value));
  return index === -1 ? Number.POSITIVE_INFINITY : index;
};

const getTimetableRank = (value?: string | null) => {
  const index = value ? TIMETABLE_ORDER.indexOf(value) : -1;
  return index === -1 ? Number.POSITIVE_INFINITY : index;
};

const mapStudent = (student: StudentWithMonths) => {
  const months = student.months.map((month) => ({
    id: month.id,
    label: month.label,
    createdAt: month.createdAt,
    updatedAt: month.updatedAt,
    studentId: month.studentId,
    classes: month.classes,
  }));

  const classes = months.flatMap((month) =>
    month.classes.map((cls) => ({
      ...cls,
      monthLabel: month.label,
    })),
  );

  return {
    id: student.id,
    name: student.name,
    birthday: student.birthday,
    telephone: student.telephone,
    day: student.day,
    // Prisma returns the enum name (e.g. EIGHTEEN). Convert to the
    // user-facing mapped value (e.g. "18:30") before sending to client.
    timetable: timetableNameToValue(student.timetable),
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    months,
    classes,
  };
};

export const studentsRouter = createTRPCRouter({
  list: publicProcedure
    .input(studentSearchInput)
    .query(async ({ ctx, input }) => {
      const students = await ctx.db.student.findMany({
        where: input?.search
          ? {
              name: {
                contains: input.search,
                mode: "insensitive",
              },
            }
          : undefined,
        include: { months: { include: { classes: true } } },
      });

      return students.map(mapStudent).sort((a, b) => {
        const dayDiff = getDayRank(a.day) - getDayRank(b.day);
        if (dayDiff !== 0) return dayDiff;
        const timeDiff =
          getTimetableRank(a.timetable) - getTimetableRank(b.timetable);
        if (timeDiff !== 0) return timeDiff;
        return a.name.localeCompare(b.name);
      });
    }),

  byId: publicProcedure.input(studentIdInput).query(async ({ ctx, input }) => {
    const student = await ctx.db.student.findUnique({
      where: { id: input.id },
      include: { months: { include: { classes: true } } },
    });

    return student ? mapStudent(student) : null;
  }),

  create: publicProcedure
    .input(studentCreateInput)
    .mutation(async ({ ctx, input }) => {
      const name =
        input.name.trim().length > 0
          ? input.name.trim().charAt(0).toUpperCase() +
            input.name.trim().slice(1)
          : input.name.trim();
      const student = await ctx.db.student.create({
        data: {
          name,
          birthday: input.birthday ? new Date(input.birthday) : undefined,
          telephone: input.telephone,
          day: input.day,
          timetable: timetableValueToName(input.timetable) as
            | Timetable
            | undefined,
        },
        include: { months: { include: { classes: true } } },
      });
      return mapStudent(student as StudentWithMonths);
    }),

  update: publicProcedure
    .input(studentUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const updated = await ctx.db.student.update({
        where: { id },
        data: {
          name: rest.name
            ? rest.name.trim().charAt(0).toUpperCase() +
              rest.name.trim().slice(1)
            : undefined,
          birthday: rest.birthday ? new Date(rest.birthday) : undefined,
          telephone: rest.telephone,
          day: rest.day,
          timetable: timetableValueToName(rest.timetable) as
            | Timetable
            | undefined,
        },
        include: { months: { include: { classes: true } } },
      });
      return mapStudent(updated as StudentWithMonths);
    }),

  delete: publicProcedure
    .input(studentIdInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction([
        ctx.db.class.deleteMany({ where: { month: { studentId: input.id } } }),
        ctx.db.month.deleteMany({ where: { studentId: input.id } }),
        ctx.db.student.delete({ where: { id: input.id } }),
      ]);
      return { success: true };
    }),

  addMonth: publicProcedure
    .input(monthInput)
    .mutation(async ({ ctx, input }) => {
      const studentExists = await ctx.db.student.findUnique({
        where: { id: input.studentId },
      });
      if (!studentExists) {
        throw new Error("Student not found");
      }

      const label = input.label.trim();
      const month = await ctx.db.month.create({
        data: {
          label,
          studentId: input.studentId,
        },
      });

      return month;
    }),

  addClass: publicProcedure
    .input(newClassInput)
    .mutation(async ({ ctx, input }) => {
      const month = await ctx.db.month.findFirst({
        where: { id: input.monthId, studentId: input.studentId },
      });
      if (!month) {
        throw new Error("Month not found for student");
      }

      await ctx.db.class.create({
        data: {
          className: input.className,
          assistance: input.assistance ?? false,
          classPrice: new Prisma.Decimal(input.classPrice),
          classDay: input.classDay ? new Date(input.classDay) : undefined,
          classPaid: input.classPaid ?? false,
          ovenName: input.ovenName,
          ovenPrice: input.ovenPrice ?? "",
          ovenPaid: input.ovenPaid ?? false,
          materialName: input.materialName ?? "",
          materialPrice: input.materialPrice ?? "",
          materialPaid: input.materialPaid ?? false,
          monthId: input.monthId,
        },
      });

      const student = await ctx.db.student.findUnique({
        where: { id: input.studentId },
        include: { months: { include: { classes: true } } },
      });

      return student ? mapStudent(student) : null;
    }),

  updateClass: publicProcedure
    .input(updateClassInput)
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.class.update({
        where: { id: input.classId },
        data: {
          className: input.className,
          assistance: input.assistance ?? undefined,
          classPrice: new Prisma.Decimal(input.classPrice),
          classDay: input.classDay ? new Date(input.classDay) : undefined,
          classPaid: input.classPaid ?? undefined,
          ovenName: input.ovenName,
          ovenPrice: input.ovenPrice,
          ovenPaid: input.ovenPaid ?? undefined,
          materialName: input.materialName,
          materialPrice: input.materialPrice,
          materialPaid: input.materialPaid ?? undefined,
        },
      });
      return updated;
    }),

  deleteClass: publicProcedure
    .input(deleteClassInput)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.class.delete({ where: { id: input.classId } });
      return { success: true };
    }),

  classes: publicProcedure.query(async ({ ctx }) => {
    const classes = await ctx.db.class.findMany({
      include: { month: { include: { student: true } } },
      orderBy: { createdAt: "desc" },
    });

    return classes.map((cls) => ({
      ...cls,
      monthLabel: cls.month.label,
      studentId: cls.month.studentId,
      studentName: cls.month.student.name,
    }));
  }),
});
