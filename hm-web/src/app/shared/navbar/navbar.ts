import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  isMenuOpen = false;
  logoPath = '/assets/images/logo-hm.svg';
  
  // Hacemos el servicio público para usarlo en el HTML
  public userService = inject(UserService);

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}