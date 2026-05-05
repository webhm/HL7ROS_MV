import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css' // Opcional si está vacío
})
export class HomeComponent {


  abrirTicketSoporte() {
      window.open('https://metropolitano.proactivanet.com/proactivanet/portal/', '_blank');
  }


}