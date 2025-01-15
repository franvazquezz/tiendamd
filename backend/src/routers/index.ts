import {initTRPC} from "@trpc/server";
import {z} from "zod";
import {userRouter} from "./userRouter";

const t = initTRPC.create();

export const appRouter = t.router({
	user: userRouter,
});

export type AppRouter = typeof appRouter; // Asegúrate de exportar este tipo
