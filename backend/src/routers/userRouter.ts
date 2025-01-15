import {t} from "../context";
import {z} from "zod";

export const userRouter = t.router({
	getUser: t.procedure.input(z.object({id: z.string()})).query(({input}) => {
		return {id: input.id, name: "Usuario Ejemplo"};
	}),
});
