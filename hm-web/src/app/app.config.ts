import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations'; // Obligatorio para Toastr
import { provideToastr } from 'ngx-toastr';
import { provideRouter, withComponentInputBinding } from '@angular/router'; 
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()), 
    provideHttpClient(withFetch()),
    provideAnimations(), 
    provideToastr({
      timeOut: 4000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      progressBar: true,
      enableHtml: true, // <--- VITAL: Permite insertar HTML personalizado
      tapToDismiss: false // <--- Evita que se cierre al hacer clic accidentalmente
    }),
  ]
};