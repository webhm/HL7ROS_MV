import { MensajesComponent } from './pages/mensajes/mensajes';
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';

import { UserComponent, perfilGuard } from './pages/user/user';
import { NoAutorizado} from './pages/no-autorizado/no-autorizado';
import { AseguradosComponent } from './pages/asegurados/asegurados';
import { RegistroAseguradoComponent } from './pages/registro-asegurado/registro-asegurado';
import { DependientesComponent } from './pages/dependientes/dependientes';
import { ConfiguracionComponent } from './pages/configuracion/configuracion';
import { PacientesComponent } from './pages/pacientes/pacientes';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Inicio', canActivate: [perfilGuard] },
  { path: 'mensajes', component: MensajesComponent, title: 'Mensajes HL7', canActivate: [perfilGuard] },
  { path: 'pacientes', component: PacientesComponent, title: 'Buscar Pacientes', canActivate: [perfilGuard] },

  { path: 'perfil', component: UserComponent, title: 'Mi Perfil', canActivate: [perfilGuard] },
  { path: 'noAutorizado', component: NoAutorizado, title: 'Acceso Denegado' },
  { path: 'asegurados', component: AseguradosComponent, title: 'Listado de Asegurados', canActivate: [perfilGuard] },
  { path: 'asegurados/nuevo', component: RegistroAseguradoComponent, title: 'Registrar Asegurado, canActivate: [perfilGuard] ' },
  { path: 'asegurados/editar/:id', component: RegistroAseguradoComponent, title: 'Editar Asegurado', canActivate: [perfilGuard]  },
  { path: 'asegurados/:id/dependientes', component: DependientesComponent, title: 'Dependientes', canActivate: [perfilGuard]  },
  { path: 'configuracion', component: ConfiguracionComponent, title: 'Configuración', canActivate: [perfilGuard]  },
  { path: '**', redirectTo: 'noAutorizado' }
];