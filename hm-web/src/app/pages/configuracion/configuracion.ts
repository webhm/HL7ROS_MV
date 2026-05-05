import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AseguradosService } from '../../services/asegurados';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class ConfiguracionComponent implements OnInit {
  private servicio = inject(AseguradosService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);

  activeTab: 'parametros' | 'notificaciones' = 'parametros';
  cargando = false;

  listaTipos: any[] = [];
  listaPlanes: any[] = [];
  listaAsegurados: any[] = []; 

  configEdades = {
    edad_max_titular: 0,
    edad_max_dependiente: 0
  };

  tempNotif = {
    activa: false,        // Nombre exacto del campo: 'activa'
    diasAnticipacion: 30,
    frecuencia: 'diaria',
    correosDestino: ''    // Lo manejaremos como string en el formulario
  };

  nuevoPlanInput = '';
  nuevoTipoInput = '';

  ngOnInit() {
    this.cargarConfiguracionInicial();
  }

  cambiarTab(tab: 'parametros' | 'notificaciones') {
    this.activeTab = tab;
  }

  cargarConfiguracionInicial() {
    this.cargando = true;
    forkJoin({
      tipos: this.servicio.obtenerCatalogoTipos().pipe(catchError(() => of([]))),
      planes: this.servicio.obtenerCatalogoPlanes().pipe(catchError(() => of([]))),
      edades: this.servicio.obtenerParametrosEdades().pipe(catchError(() => of([]))),
      asegurados: this.servicio.obtenerAsegurados().pipe(catchError(() => of([]))),
      notif: this.servicio.obtenerConfigNotificaciones().pipe(catchError(() => of(null)))
    }).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe(res => {
      this.listaTipos = res.tipos;
      this.listaPlanes = res.planes;
      this.listaAsegurados = this.extraerArray(res.asegurados);

      // --- MAPE DE NOTIFICACIONES ---
      if (res.notif) {
        this.tempNotif = {
          activa: res.notif.activa ?? false,
          diasAnticipacion: res.notif.diasAnticipacion ?? 30,
          frecuencia: res.notif.frecuencia ?? 'diaria',
          // Convertimos el array [mail1, mail2] a string "mail1, mail2"
          correosDestino: Array.isArray(res.notif.correosDestino) 
            ? res.notif.correosDestino.join(', ') 
            : ''
        };
      }

      // --- MAPE DE EDADES ---
      const e = res.edades;
      this.configEdades = {
        edad_max_titular: Number(e.edad_max_titular || e.EDAD_MAX_TITULAR || 0),
        edad_max_dependiente: Number(e.edad_max_dependiente || e.EDAD_MAX_DEPENDIENTE || 0)
      };
    });
  }

  private extraerArray(respuesta: any): any[] {
    let data = respuesta.data || respuesta.datos || respuesta.resultados || respuesta;
    return Array.isArray(data) ? data : (data && (data.nhcl || data.NHCL) ? [data] : []);
  }

  // --- REGLAS DE NEGOCIO ---
  guardarEdades() {
    this.servicio.actualizarParametrosEdades(this.configEdades).subscribe({
      next: () => this.toastr.success('Límites de edad actualizados correctamente.', 'Configuración Oracle'),
      error: () => this.toastr.error('Error al guardar las reglas de edad.')
    });
  }

  guardarNotificaciones() {
    // Antes de enviar a Oracle, convertimos el string de correos de nuevo a un Array
    const datosEnvio = {
      ...this.tempNotif,
      correosDestino: this.tempNotif.correosDestino
        ? this.tempNotif.correosDestino.split(',').map(m => m.trim())
        : []
    };

    this.servicio.actualizarConfigNotificaciones(datosEnvio).subscribe({
      next: () => this.toastr.success('Configuración de alertas guardada.', 'Éxito'),
      error: () => this.toastr.error('No se pudo guardar la configuración.')
    });
  }

  // --- GESTIÓN DE CATÁLOGOS CON CONFIRMACIÓN TOASTR ---

  eliminarPlan(id: number) {
    const plan = this.listaPlanes.find(p => p.CD_PLAN === id);
    const enUso = this.listaAsegurados.some(a => 
      String(a.tipoPlan || a.TIPOPLAN || a.TP_PLAN) === String(plan?.CD_PLAN)
    );

    if (enUso) {
      this.toastr.error(`Operación denegada: El plan "${plan?.DESCRIPCION}" está asignado a asegurados activos.`, 'Integridad Referencial');
      return;
    }

    this.lanzarConfirmacionGeneral('el plan', plan?.DESCRIPCION, () => {
      this.servicio.eliminarPlan(id).subscribe({ 
        next: () => {
          this.toastr.success('Plan eliminado.');
          this.cargarConfiguracionInicial();
        }
      });
    });
  }

  eliminarTipo(id: number) {
    const tipo = this.listaTipos.find(t => t.PK_CODIGO === id);
    const enUso = this.listaAsegurados.some(a => String(a.tipoAsegurado).trim() === String(tipo.PK_CODIGO).trim());

    if (enUso) {
      this.toastr.error(`Denegado: El tipo "${tipo.DESCRIPCION}" tiene registros asociados.`, 'Integridad');
      return;
    }

    this.lanzarConfirmacionGeneral('el tipo', tipo.DESCRIPCION, () => {
      this.cargando = true;
      this.servicio.eliminarTipoAsegurado(id).subscribe({
        next: () => {
          this.toastr.success('Tipo de asegurado eliminado.');
          this.cargarConfiguracionInicial();
        },
        error: (err) => {
          this.cargando = false;
          this.toastr.error(err.error?.message || 'Error al eliminar.');
          this.cdr.detectChanges();
        }
      });
    });
  }

  /**
   * Helper genérico para confirmaciones mediante Toastr
   */
  private lanzarConfirmacionGeneral(sujeto: string, nombre: string, callback: Function) {
    const claseBoton = `btn-conf-cfg-${Math.floor(Math.random() * 1000)}`;
    const mensaje = `¿Desea eliminar ${sujeto} <b>${nombre}</b>? <br><br> <div class="${claseBoton} btn-confirm-toast">SÍ, ELIMINAR</div>`;
    
    const toast = this.toastr.warning(mensaje, 'Confirmación', {
      disableTimeOut: true,
      closeButton: true,
      enableHtml: true,
      tapToDismiss: false,
      toastClass: 'ngx-toastr toast-confirm-custom'
    });

    setTimeout(() => {
      const el = document.getElementsByClassName(claseBoton)[0] as HTMLElement;
      if (el) {
        el.onclick = (e) => {
          e.stopPropagation();
          this.toastr.clear(toast.toastId);
          callback();
        };
      }
    }, 150);
  }

  // --- MÉTODOS DE ADICIÓN ---
  agregarPlan() {
    if (!this.nuevoPlanInput.trim()) return;
    this.servicio.crearPlan({ descripcion: this.nuevoPlanInput }).subscribe({
      next: () => {
        this.toastr.success('Nuevo plan registrado.');
        this.nuevoPlanInput = '';
        this.cargarConfiguracionInicial();
      }
    });
  }

  agregarTipo() {
    if (!this.nuevoTipoInput.trim()) return;
    this.servicio.crearTipoAsegurado({ descripcion: this.nuevoTipoInput }).subscribe({
      next: () => {
        this.toastr.success('Nuevo tipo de asegurado creado.');
        this.nuevoTipoInput = '';
        this.cargarConfiguracionInicial();
      }
    });
  }
}