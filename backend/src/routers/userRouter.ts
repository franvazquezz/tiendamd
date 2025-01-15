import {t} from "../context";
import {z} from "zod";

export const userRouter = t.router({
	getUser: t.procedure
		.input(z.object({id: z.string()})) // Define que el input debe ser un objeto con un campo `id` de tipo string
		.query(({input}) => {
			const {id} = input;
			// Simula obtener datos del usuario
			return {id, name: "John Doe"};
		}),
});
