import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegracionHl7Service } from '../../services/integracion-hl7';

export interface ElementoColaVista {
  id: any;
  mensaje: string;
  tipo: string;
  fecha: string;
  estado: string;
  intentos: number;
  logError: string | null;
}

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajes.html',
  styleUrls: ['./mensajes.css']
})
export class MensajesComponent implements OnInit {
  private integracionService = inject(IntegracionHl7Service);

  mensajes: ElementoColaVista[] = [];
  mensajesFiltrados: ElementoColaVista[] = [];
  cargando = false;

  filtros = {
    fechaIngreso: '',
    estado: 'TODOS',
    tipo: 'TODOS'
  };

  ngOnInit(): void {
    this.cargarMensajes();
  }

  cargarMensajes(): void {
    this.cargando = true;
    
    // Usamos 'any' aquí temporalmente para que TypeScript no bloquee el mapeo robusto
    this.integracionService.verCola().subscribe({
      next: (res: any) => {
        // 1. Imprimimos en consola para depuración
        console.log('Respuesta cruda de la cola de mensajes (API):', res);

        // 2. Extracción segura del Arreglo (Por si el backend lo envuelve en { data: [...] } o similar)
        let datosApi: any[] = [];
        if (Array.isArray(res)) {
          datosApi = res;
        } else if (res && Array.isArray(res.data)) {
          datosApi = res.data;
        } else if (res && Array.isArray(res.items)) {
          datosApi = res.items;
        } else if (res && typeof res === 'object') {
          datosApi = [res]; // Por si por error devuelve solo un objeto
        }

        // 3. MAPEO ROBUSTO a la vista
        this.mensajes = datosApi.map(apiItem => {
          let nombrePaciente = 'Paciente Desconocido';
          let origenAtencion = '';
          
          // Parseo seguro del JSON (Evita que la app se rompa si el JSON viene malformado)
          try {
            if (apiItem.payloadJson || apiItem.PAYLOAD_JSON) {
              const payloadCrudo = apiItem.payloadJson || apiItem.PAYLOAD_JSON;
              // Si el payload ya es un objeto, no lo parseamos; si es string, lo parseamos
              const payload = typeof payloadCrudo === 'string' ? JSON.parse(payloadCrudo) : payloadCrudo;
              
              nombrePaciente = payload.NM_PACIENTE || payload.NOMBRES || payload.nombresPaciente || 'Sin Nombre';
              origenAtencion = payload.DS_ORI_ATE ? `(${payload.DS_ORI_ATE})` : '';
            }
          } catch (e) {
            console.warn(`No se pudo leer el JSON del id ${apiItem.idMensaje || apiItem.id}`, e);
          }

          // Fecha segura
          const fechaCruda = apiItem.fechaCreacion || apiItem.FECHA_CREACION || '';
          const fechaFormateada = fechaCruda ? String(fechaCruda).replace('T', ' ').substring(0, 19) : '';

          // Estado seguro (Si viene null o undefined, ponemos 'Pendiente')
          const estadoCrudo = String(apiItem.estado || apiItem.ESTADO || 'Pendiente');
          const estadoNormalizado = estadoCrudo.charAt(0).toUpperCase() + estadoCrudo.slice(1).toLowerCase();

          return {
            id: apiItem.idMensaje || apiItem.ID_MENSAJE || apiItem.id || 'N/A',
            mensaje: `NHCL: ${apiItem.cdPaciente || apiItem.CD_PACIENTE || 'N/A'} - ${nombrePaciente} ${origenAtencion}`,
            tipo: apiItem.tipo || 'Sincronizacion',
            fecha: fechaFormateada,
            estado: estadoNormalizado, 
            intentos: apiItem.intentos || apiItem.INTENTOS || 0,
            logError: apiItem.logError || apiItem.LOG_ERROR || null
          };
        });

        console.log('Mensajes listos para mostrar en tabla:', this.mensajes);
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar la cola de mensajes:', err);
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    // Verificación de seguridad extra: asegura que no falle si "mensajes" es undefined
    if (!this.mensajes) return;

    this.mensajesFiltrados = this.mensajes.filter(m => {
      // Uso de || '' para evitar errores de "Cannot read properties of undefined (reading 'toUpperCase')"
      const estadoMensaje = (m.estado || '').toUpperCase();
      const tipoMensaje = (m.tipo || '').toUpperCase();
      const fechaMensaje = (m.fecha || '');
      
      const cumpleEstado = this.filtros.estado === 'TODOS' || estadoMensaje === this.filtros.estado.toUpperCase();
      const cumpleTipo = this.filtros.tipo === 'TODOS' || tipoMensaje === this.filtros.tipo.toUpperCase();
      const cumpleFecha = !this.filtros.fechaIngreso || fechaMensaje.includes(this.filtros.fechaIngreso);

      return cumpleEstado && cumpleTipo && cumpleFecha;
    });
  }

  limpiarFiltros(): void {
    this.filtros = { fechaIngreso: '', estado: 'TODOS', tipo: 'TODOS' };
    this.aplicarFiltros();
  }

  reprocesarMensaje(id: any): void {
    console.log(`Enviando a reprocesar ID: ${id}`);
    // Descomentar cuando uses el endpoint:
    // this.integracionService.reprocesarErrores().subscribe(() => this.cargarMensajes());
  }
}