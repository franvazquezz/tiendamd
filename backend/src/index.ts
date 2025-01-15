import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import {appRouter} from "./routers";
import {createContext} from "./context";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
	"/trpc",
	trpcExpress.createExpressMiddleware({
		router: appRouter,
		createContext,
	})
);

app.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
