import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AseguradosService {
  private http = inject(HttpClient);
  // Asumiendo que tu endpoint principal para titulares es /asegurados
  private apiUrl = `${environment.apiUrl}/asegurados`;

  // ==========================================
  // MANEJO GLOBAL DE ERRORES DEL BACKEND
  // ==========================================
 // ==========================================
  // MANEJO GLOBAL DE ERRORES DEL BACKEND
  // ==========================================
  private manejarError(error: HttpErrorResponse) {
    let mensajeError = 'Ocurrió un error inesperado al conectar con el servidor.';

    // Angular guarda el JSON que envía tu backend dentro de `error.error`
    if (error.error) {
      // 1. Prioridad principal: capturar tu llave "message"
      if (error.error.message) {
        mensajeError = error.error.message;
      } 
      // 2. Respaldos por si algún otro endpoint usa estructuras diferentes
      else if (error.error.error) {
        mensajeError = error.error.error;
      } else if (typeof error.error === 'string') {
        mensajeError = error.error;
      }
    } 
    // Si la petición ni siquiera llegó al servidor (ej. sin internet o backend apagado)
    else if (error.message) {
      mensajeError = error.message;
    }

    console.error('📡 Error interceptado en el servicio HTTP:', error);
    
    // Retornamos el texto limpio para que tu componente lo muestre en el alert()
    return throwError(() => new Error(mensajeError));
  }

  // NUEVO: Obtener catálogo de tipos de asegurados
  obtenerCatalogoTipos(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/catalogos/tipos-asegurado`).pipe(
      map(res => res.data || res),
      catchError(err => this.manejarError(err))
    );
  }

  // NUEVO: Obtener catálogo de planes
  obtenerCatalogoPlanes(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/catalogos/planes`).pipe(
      map(res => res.data || res),
      catchError(err => this.manejarError(err))
    );
  }

  // --- MÉTODOS DE PARÁMETROS DE NEGOCIO (EDADES) ---

  /**
   * Obtiene los límites de edad configurados para dependientes (Hijos y Padres).
   *
   */
  obtenerParametrosEdades(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/configuracion/edades`).pipe(
      map(res => res.data || res),
      catchError(err => this.manejarError(err))
    );
  }

  /**
   * Actualiza los límites de edad en la base de datos.
   *edad_max_titular: 0,
    edad_max_dependiente: 0
   */
  actualizarParametrosEdades(datos: { edad_max_titular: number, edad_max_dependiente: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/configuracion/edades`, datos).pipe(
      catchError(err => this.manejarError(err))
    );
  }

  // --- MÉTODOS PARA CATÁLOGO DE PLANES ---

  /**
   * Crea un nuevo registro de plan en el catálogo.
   *
   */
  crearPlan(plan: { descripcion: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/catalogos/planes`, plan).pipe(
      catchError(err => this.manejarError(err))
    );
  }

  /**
   * Elimina un plan del catálogo por su ID (PK_CODIGO).
   *
   */
  eliminarPlan(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/catalogos/planes/${id}`).pipe(
      catchError(err => this.manejarError(err))
    );
  }

  // --- MÉTODOS PARA CATÁLOGO DE TIPOS DE ASEGURADO ---

  /**
   * Crea un nuevo tipo de asegurado (ej: Pasante, Externo).
   *
   */
  crearTipoAsegurado(tipo: { descripcion: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/catalogos/tipos-asegurado`, tipo).pipe(
      catchError(err => this.manejarError(err))
    );
  }

  /**
   * Obtiene el catálogo de parentescos para los dependientes
   */
  obtenerCatalogoParentescos(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/catalogos/parentescos`).pipe(
      map(res => res.data || res),
      catchError(err => this.manejarError(err))
    );
  }

  /**
   * Elimina un tipo de asegurado del catálogo por su ID (PK_CODIGO).
   *
   */
  eliminarTipoAsegurado(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/catalogos/tipos-asegurado/${id}`).pipe(
      catchError(err => this.manejarError(err))
    );
  }

  // =========================================
  // 1. MÉTODOS DE NOTIFICACIONES (Solución al Error)
  // =========================================

  /**
   * Obtiene la configuración actual de alertas desde la base de datos
   */
  obtenerConfigNotificaciones(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/configuracion/notificaciones`).pipe(
      map(res => res.data || res),
      catchError(err => this.manejarError(err))
    );
  }

  /**
   * Actualiza los parámetros de envío de correos y alertas
   */
  actualizarConfigNotificaciones(datos: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/configuracion/notificaciones`, datos).pipe(
      catchError(err => this.manejarError(err))
    );
  }

  // ==========================================
  // MÉTODOS PARA TITULARES (ASEGURADOS)
  // ==========================================

  obtenerAsegurados(): Observable<any> {
    return this.http.get(this.apiUrl).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  obtenerPorNhcl(nhcl: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${nhcl}`).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  agregarAsegurado(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  actualizarAsegurado(nhcl: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${nhcl}`, data).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  eliminarAsegurado(nhcl: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${nhcl}`).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  // ==========================================
  // MÉTODOS PARA DEPENDIENTES
  // ==========================================

  obtenerDependientes(nhclTitular: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${nhclTitular}/dependientes`).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  agregarDependiente(nhclTitular: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${nhclTitular}/dependientes`, data).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  actualizarDependiente(nhclTitular: string, nhclDependiente: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${nhclTitular}/dependientes/${nhclDependiente}`, data).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  eliminarDependiente(nhclTitular: string, nhclDependiente: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${nhclTitular}/dependientes/${nhclDependiente}`).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  // ==========================================
  // MÉTODOS DE BÚSQUEDA EN BASE EXTERNA
  // ==========================================

  buscarEnBaseExterna(criterio: string, tipo: string): Observable<any> {
    // Ejemplo: /busqueda-externa?cedula=1712345678 ó ?nombres=Perez Juan
    return this.http.get(`${environment.apiUrl}/buscar?${tipo}=${criterio}`).pipe(
      catchError((err) => this.manejarError(err))
    );
  }

  buscarDependienteEnBaseExterna(criterio: string, tipo: string): Observable<any> {
    // Endpoint específico para dependientes
    return this.http.get(`${environment.apiUrl}/buscar-para-dependientes?${tipo}=${criterio}`).pipe(
      catchError((err) => this.manejarError(err))
    );
  }
}