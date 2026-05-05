import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NavbarComponent], 
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {}