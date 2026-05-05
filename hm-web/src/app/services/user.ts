import { Injectable, signal } from '@angular/core';

export interface Usuario {
  username: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Signal para manejar el estado del usuario de forma reactiva
  currentUser = signal<Usuario | null>(null);

  setUser(id: string) {
    // Simulamos la creación del usuario basado en el ID de la URL
    const newUser: Usuario = {
      username: id.toUpperCase(),
      nombre: 'Usuario',
      apellido: id,
      email: `${id.toLowerCase()}@empresa.com`,
      rol: 'Cajero'
    };
    this.currentUser.set(newUser);
  }

  logout() {
    this.currentUser.set(null);
  }
}