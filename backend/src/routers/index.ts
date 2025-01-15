import {t} from "../context";
import {userRouter} from "./userRouter";

export const appRouter = t.router({
	user: userRouter,
});

export type AppRouter = typeof appRouter;
