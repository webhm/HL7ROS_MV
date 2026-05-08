import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
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
export class MensajesComponent implements OnInit, OnDestroy {
  private integracionService = inject(IntegracionHl7Service);
  private cdr = inject(ChangeDetectorRef); 

  mensajes: ElementoColaVista[] = [];
  mensajesFiltrados: ElementoColaVista[] = [];
  cargando = false;
  
  // Variables para la Auto-Actualización
  autoActualizar = false;
  private intervaloRef: any;

  filtros = {
    fechaIngreso: '',
    estado: 'PENDIENTE',
    tipo: 'TODOS'
  };

  ngOnInit(): void {
    this.cargarMensajes();
  }

  // Súper importante: Limpiar el intervalo al salir de la pantalla
  ngOnDestroy(): void {
    this.detenerAutoActualizacion();
  }

  // --- LÓGICA DE AUTO-ACTUALIZACIÓN ---
  toggleAutoActualizacion(): void {
    this.autoActualizar = !this.autoActualizar;
    
    if (this.autoActualizar) {
      // 5 minutos = 300,000 milisegundos
      this.intervaloRef = setInterval(() => {
        console.log('[DEBUG] Ejecutando auto-actualización programada...');
        this.cargarMensajes();
      }, 60000);
    } else {
      this.detenerAutoActualizacion();
    }
    
    this.cdr.detectChanges();
  }

  private detenerAutoActualizacion(): void {
    if (this.intervaloRef) {
      clearInterval(this.intervaloRef);
      this.intervaloRef = null;
    }
  }
  // ------------------------------------

  cargarMensajes(): void {
    try {
      this.cargando = true;
      this.cdr.detectChanges(); 

      this.integracionService.verCola().subscribe({
        next: (res: any) => {
          this.cargando = false; 
          this.cdr.detectChanges(); 

          try {
            const datosRaw = Array.isArray(res) ? res : (res?.data || res?.items || []);
            
            this.mensajes = datosRaw.map((item: any) => {
              let nombre = 'Paciente Desconocido';
              let origen = '';
              
              if (item && (item.payloadJson || item.PAYLOAD_JSON)) {
                const pStr = item.payloadJson || item.PAYLOAD_JSON;
                const payload = typeof pStr === 'string' ? JSON.parse(pStr) : pStr;
                nombre = payload.NM_PACIENTE || payload.nombre || 'Sin nombre';
                origen = payload.DS_ORI_ATE ? `(${payload.DS_ORI_ATE})` : '';
              }

              const estadoCrudo = String(item?.estado || item?.ESTADO || 'Pendiente');

              return {
                id: item?.idMensaje || item?.ID_MENSAJE || item?.id || 0,
                mensaje: `NHCL: ${item?.cdPaciente || 'N/A'} - ${nombre} ${origen}`,
                tipo: item?.tipo || 'Sincronizacion',
                fecha: (item?.fechaCreacion || '').replace('T', ' ').substring(0, 16),
                estado: estadoCrudo.charAt(0).toUpperCase() + estadoCrudo.slice(1).toLowerCase(),
                intentos: item?.intentos || 0,
                logError: item?.logError || null
              };
            });

            this.aplicarFiltros();

          } catch (e) {
            console.error('[DEBUG] Error interno al mapear los datos del JSON:', e);
          }
        },
        error: (err) => {
          console.error('[DEBUG] Error HTTP al conectar con el servidor:', err);
          this.cargando = false;
          this.cdr.detectChanges(); 
        },
        complete: () => {
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
    } catch (errorCritico) {
      console.error('[DEBUG] Error crítico antes de hacer la petición:', errorCritico);
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  aplicarFiltros(): void {
    if (!this.mensajes) return;
    
    const busquedaEstado = this.filtros.estado.toUpperCase();
    
    this.mensajesFiltrados = this.mensajes.filter(m => {
      const estadoMsg = (m.estado || '').toUpperCase();
      const tipoMsg = (m.tipo || '').toUpperCase();
      const fechaMsg = m.fecha || '';

      const cumpleEstado = busquedaEstado === 'TODOS' || estadoMsg === busquedaEstado;
      const cumpleTipo = this.filtros.tipo === 'TODOS' || tipoMsg === this.filtros.tipo.toUpperCase();
      const cumpleFecha = !this.filtros.fechaIngreso || fechaMsg.includes(this.filtros.fechaIngreso);
      
      return cumpleEstado && cumpleTipo && cumpleFecha;
    });

    this.cdr.detectChanges(); 
  }

  limpiarFiltros(): void {
    this.filtros = { fechaIngreso: '', estado: 'PENDIENTE', tipo: 'TODOS' };
    this.aplicarFiltros();
  }

  reprocesarMensaje(id: any): void {
    console.log(`[DEBUG] Reprocesando mensaje ID: ${id}`);
    // this.integracionService.reprocesarErrores().subscribe(() => this.cargarMensajes());
  }
}