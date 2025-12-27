import { Prisma } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const dateString = z
  .string()
  .optional()
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
    message: "Invalid date",
  });

const classInput = z.object({
  className: z.string().min(1),
  assistance: z.array(z.boolean()).length(4).optional(),
  classPrice: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "number" ? val : Number(val))),
  classDay: dateString,
  classPaid: z.boolean().optional(),
  ovenName: z.string().optional(),
  ovenPrice: z.string().optional(),
  ovenPaid: z.boolean().optional(),
  materialName: z.string().optional(),
  materialPrice: z.string().optional(),
  materialPaid: z.boolean().optional(),
});

type StudentWithClasses = Prisma.StudentGetPayload<{
  include: { classes: { include: { class: true } } };
}>;

const mapStudent = (student: StudentWithClasses) => ({
  id: student.id,
  name: student.name,
  birthday: student.birthday,
  telephone: student.telephone,
  day: student.day,
  timetable: student.timetable,
  createdAt: student.createdAt,
  updatedAt: student.updatedAt,
  classes: student.classes
    .map((link) => link.class)
    .filter((cls): cls is NonNullable<typeof cls> => Boolean(cls)),
});

export const studentsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ search: z.string().optional() }).optional())
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
        include: { classes: { include: { class: true } } },
        orderBy: { createdAt: "desc" },
      });

      return students.map(mapStudent);
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const student = await ctx.db.student.findUnique({
        where: { id: input.id },
        include: { classes: { include: { class: true } } },
      });

      return student ? mapStudent(student) : null;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        birthday: dateString,
        telephone: z.string().optional(),
        day: z.string().optional(),
        timetable: z.string().optional(),
      }),
    )
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
          timetable: input.timetable,
        },
        include: { classes: { include: { class: true } } },
      });
      return mapStudent(student);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        birthday: dateString,
        telephone: z.string().optional(),
        day: z.string().optional(),
        timetable: z.string().optional(),
      }),
    )
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
          timetable: rest.timetable,
        },
        include: { classes: { include: { class: true } } },
      });
      return mapStudent(updated);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction([
        ctx.db.studentClass.deleteMany({ where: { studentId: input.id } }),
        ctx.db.student.delete({ where: { id: input.id } }),
      ]);
      return { success: true };
    }),

  addClass: publicProcedure
    .input(
      classInput.extend({
        studentId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const studentExists = await ctx.db.student.findUnique({
        where: { id: input.studentId },
      });
      if (!studentExists) {
        throw new Error("Student not found");
      }

      await ctx.db.class.create({
        data: {
          className: input.className,
          assistance: input.assistance,
          classPrice: new Prisma.Decimal(input.classPrice),
          classDay: input.classDay ? new Date(input.classDay) : undefined,
          classPaid: input.classPaid ?? false,
          ovenName: input.ovenName,
          ovenPrice: input.ovenPrice ?? "",
          ovenPaid: input.ovenPaid ?? false,
          materialName: input.materialName ?? "",
          materialPrice: input.materialPrice ?? "",
          materialPaid: input.materialPaid ?? false,
          students: {
            create: [{ student: { connect: { id: input.studentId } } }],
          },
        },
      });

      const student = await ctx.db.student.findUnique({
        where: { id: input.studentId },
        include: { classes: { include: { class: true } } },
      });

      return student ? mapStudent(student) : null;
    }),

  updateClass: publicProcedure
    .input(
      classInput.extend({
        classId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.class.update({
        where: { id: input.classId },
        data: {
          className: input.className,
          assistance: input.assistance,
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
    .input(z.object({ classId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction([
        ctx.db.studentClass.deleteMany({ where: { classId: input.classId } }),
        ctx.db.class.delete({ where: { id: input.classId } }),
      ]);
      return { success: true };
    }),

  classes: publicProcedure.query(async ({ ctx }) => {
    const classes = await ctx.db.class.findMany({
      include: { students: { include: { student: true } } },
      orderBy: { createdAt: "desc" },
    });

    return classes;
  }),
});
