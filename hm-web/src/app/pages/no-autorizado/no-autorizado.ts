import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-no-autorizado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './no-autorizado.html',
  styleUrl: './no-autorizado.css'
})
export class NoAutorizado {
  private router = inject(Router);

  reintentar() {
    // Redirige a la raíz para que el sistema intente cargar el perfil
    // this.router.navigate(['/perfil?user=MCHANG']);
    // window.location.reload();
  }
}