import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, CanActivateFn } from '@angular/router'; 
import { UserService } from '../../services/user';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.html',
  styleUrl: './user.css'
})
export class UserComponent implements OnInit {
  public userService = inject(UserService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Inyectamos para leer la URL
  
  public dateUser = Date.now();
  public nombreUsuario: string | null = null;

  ngOnInit() {
    // Capturamos el usuario directamente de los Query Params (?user=...)
    this.route.queryParams.subscribe(params => {
      this.nombreUsuario = params['user'] || localStorage.getItem('usuario_logueado');
      
      // Si por alguna razón llegamos aquí sin usuario (aunque el guard lo impide)
      if (!this.nombreUsuario) {
        this.router.navigate(['/no-autorizado']);
      }
    });
  }

  cerrarSesion() {
    this.userService.logout();
    localStorage.removeItem('usuario_logueado');
    // Al cerrar sesión, volvemos al home sin parámetros
    this.router.navigate(['/home']); 
  }
}


export const perfilGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // 1. PRIORIDAD: Si el destino es 'perfil', SIEMPRE permitimos el acceso.
  // Usamos route.routeConfig?.path para comparar con la definición de la ruta
  if (route.routeConfig?.path === 'perfil') {
      // 2. Para el resto de rutas (asegurados, configuracion, etc.)
    const sessionUser = localStorage.getItem('usuario_logueado');
    const urlUser = route.queryParams['user'];

    // Si hay sesión o viene el usuario por URL, permitimos
    if ((sessionUser && sessionUser.trim() !== '') || (urlUser && urlUser.trim() !== '')) {
      // Si vino por URL, actualizamos el storage para futuras navegaciones
      if (urlUser) {
        localStorage.setItem('usuario_logueado', urlUser);
      }
      return true;
    }
  }

  // 2. Para el resto de rutas (asegurados, configuracion, etc.)
  const sessionUser = localStorage.getItem('usuario_logueado');
  const urlUser = route.queryParams['user'];

  // Si hay sesión o viene el usuario por URL, permitimos
  if ((sessionUser && sessionUser.trim() !== '') || (urlUser && urlUser.trim() !== '')) {
    // Si vino por URL, actualizamos el storage para futuras navegaciones
    if (urlUser) {
      localStorage.setItem('usuario_logueado', urlUser);
    }
    return true;
  }

  // 3. BLOQUEO: Si no es perfil y no hay usuario, redirigir
  router.navigate(['/no-autorizado']);
  return false;
};