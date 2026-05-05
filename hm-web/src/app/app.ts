import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from './shared/header/header';
import { FooterComponent } from './shared/footer/footer';
import { UserService } from './services/user';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'Plan de Asistencia Médica';
  
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  ngOnInit() {
    // Escucha global de parámetros en la URL
    this.route.queryParams.subscribe(params => {
      // Busca ?user=MCHANG o simplemente ?MCHANG
      const userId = params['user'] || Object.keys(params)[0];
      
      if (userId) {
        this.userService.setUser(userId);
      }
    });
  }
}