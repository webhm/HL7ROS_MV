import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MensajeHl7Api {
  idMensaje: number;
  cdPaciente: string;
  payloadJson: string;
  estado: string;
  fechaCreacion: string;
  fechaProcesamiento: string | null;
  logError: string | null;
  intentos: number;
}

export interface PacienteCompletoRequest {
  cdPaciente?: string;
  cedulaPaciente: string;
  apellidosPaciente?: string;
  nombresPaciente?: string;
  fechaNacimiento?: string;
  sexo?: string;
}

export interface PacienteHis {
  cdPaciente: string;
  cedulaPaciente: string;
  nombresPaciente: string;
  apellidosPaciente: string;
  fechaNacimiento: string;
  sexo: string;
  direccion?: string;
  celular?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IntegracionHl7Service {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/Integracion`;

  sincronizarPacientes() { return this.http.post(`${this.apiUrl}/sincronizar-pacientes`, {}); }
  procesarLote5() { return this.http.post(`${this.apiUrl}/procesar-lote-5`, {}); }
  procesarLote5Tcp() { return this.http.post(`${this.apiUrl}/procesar-lote-5-tcp`, {}); }
  reprocesarErrores() { return this.http.put(`${this.apiUrl}/reprocesar-errores`, {}); }
  probarEnvioDirecto(paciente: PacienteCompletoRequest) { return this.http.post(`${this.apiUrl}/probar-envio-directo`, paciente); }
  
  verCola(): Observable<MensajeHl7Api[]> {
    return this.http.get<MensajeHl7Api[]>(`${this.apiUrl}/ver-cola`);
  }

  buscarPacientes(criterio: string): Observable<PacienteCompletoRequest[]> {
    return this.http.get<PacienteCompletoRequest[]>(`${environment.apiUrl}/api/Pacientes/buscar?q=${criterio}`);
  }

  // Busca el paciente en el HIS por cédula
  buscarPacientePorCedula(cedula: string): Observable<PacienteHis> {
    return this.http.get<PacienteHis>(`${this.apiUrl}/buscar-paciente/${cedula}`);
  }

  // Envía el mensaje HL7 a demanda (HIS -> RIS)
  enviarMensajeDemanda(paciente: PacienteHis): Observable<any> {
    // Este usa el endpoint de "probar-envio-directo" que vimos en el Swagger
    return this.http.post(`${this.apiUrl}/probar-escritura-red`, paciente);
  }
}