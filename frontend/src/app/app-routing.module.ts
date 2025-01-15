import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ExampleComponent } from './components/example/example.component' // Asegúrate de importar tu componente

const routes: Routes = [
  { path: 'example', component: ExampleComponent }, // Agregar la ruta para tu componente
  { path: '', redirectTo: '/example', pathMatch: 'full' }, // Redirecciona a '/example' al cargar la app
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
