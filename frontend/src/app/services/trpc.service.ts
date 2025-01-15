import { Injectable } from '@angular/core'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../../../../backend/src/routers/index' // Ajusta la ruta según la estructura de tu proyecto

@Injectable({
  providedIn: 'root',
})
export class TrpcService {
  private client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:4000/trpc', // Cambia la URL según tu backend
      }),
    ],
  })

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  // Métodos para interactuar con las rutas del backend
  async getUser(id: string): Promise<{ id: string; name: string }> {
    return this.client.user.getUser.query({ id }) // Verifica que esta ruta exista en el backend
  }
}
