import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppComponent } from './app.component'
import { ExampleComponent } from './components/example/example.component'
import { HttpClientModule } from '@angular/common/http' // Importa HttpClientModule
import { AppRoutingModule } from './app-routing.module' // Importa el módulo de rutas

@NgModule({
  declarations: [
    AppComponent,
    ExampleComponent, // Declara tu componente
  ],
  imports: [
    BrowserModule,
    HttpClientModule, // Asegúrate de incluir esto
    AppRoutingModule, // Incluye las rutas
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
