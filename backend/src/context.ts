import {inferAsyncReturnType, initTRPC} from "@trpc/server";

export const createContext = async () => {
	// Configuración adicional, como autenticación
	return {};
};

export type Context = inferAsyncReturnType<typeof createContext>;
export const t = initTRPC.context<Context>().create();
