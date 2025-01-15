import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import {appRouter} from "./routers"; // Ajusta según tu archivo de routers

const app = express();

// Crear contexto (si lo necesitas)
const createContext = ({req, res}: trpcExpress.CreateExpressContextOptions) => ({});

// Configurar el middleware de trpc
app.use(
	"/trpc",
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext,
	})
);

app.listen(4000, () => {
	console.log("Servidor corriendo en http://localhost:4000");
});
