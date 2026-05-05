import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Parametros {
  edadMaximaHijo: number;
  edadMaximaPadres: number;
  tiposPlanes: string[];
}

export interface ConfiguracionNotificacion {
  activarAlertas: boolean;
  diasAnticipacion: number;
  frecuencia: 'Diaria' | 'Semanal' | 'Mensual';
  correosDestino: string;
}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/configuracion`;

  parametros = signal<Parametros>({ edadMaximaHijo: 0, edadMaximaPadres: 0, tiposPlanes: [] });
  notificaciones = signal<ConfiguracionNotificacion>({ activarAlertas: false, diasAnticipacion: 0, frecuencia: 'Semanal', correosDestino: '' });

  constructor() { this.cargarConfig(); }

  cargarConfig() {
    this.http.get<any>(this.apiUrl).subscribe(data => {
      if(data.parametros) this.parametros.set(data.parametros);
      if(data.notificaciones) this.notificaciones.set(data.notificaciones);
    });
  }

  guardarParametros(params: Parametros) {
    this.http.post(`${this.apiUrl}/parametros`, params).subscribe(() => this.parametros.set(params));
  }

  guardarNotificaciones(config: ConfiguracionNotificacion) {
    this.http.post(`${this.apiUrl}/notificaciones`, config).subscribe(() => this.notificaciones.set(config));
  }
}