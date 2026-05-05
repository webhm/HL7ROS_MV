import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AseguradosService } from '../../services/asegurados';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-asegurados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './asegurados.html',
  styleUrl: './asegurados.css'
})
export class AseguradosComponent implements OnInit {
  private servicio = inject(AseguradosService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);

  // Catálogos y Datos
  listaTipos: any[] = [];
  listaPlanes: any[] = [];
  listaCompleta: any[] = [];
  listaFiltrada: any[] = [];
  
  // Estados UI
  cargando = true;
  cargandoFiltros = false;
  errorCarga = false;
  filtroFecha = '';
  filtroTipo = '';
  filtroPlan = '';

  ngOnInit() {
    this.inicializarComponente();
  }

  inicializarComponente() {
    this.cargando = true;
    this.cargandoFiltros = true;
    
    forkJoin({
      tipos: this.servicio.obtenerCatalogoTipos().pipe(catchError(() => of([]))),
      planes: this.servicio.obtenerCatalogoPlanes().pipe(catchError(() => of([]))),
      asegurados: this.servicio.obtenerAsegurados().pipe(catchError(() => {
        this.errorCarga = true;
        this.toastr.error('Error al conectar con Oracle', 'Fallo de Red');
        return of([]);
      }))
    }).pipe(
      finalize(() => {
        this.cargando = false;
        this.cargandoFiltros = false;
        this.cdr.detectChanges();
      })
    ).subscribe(res => {
      this.listaTipos = res.tipos;
      this.listaPlanes = res.planes;
      this.listaCompleta = this.extraerArray(res.asegurados);
      this.listaFiltrada = [...this.listaCompleta];
    });
  }

  private extraerArray(res: any): any[] {
    let data = res?.data || res?.datos || res;
    return Array.isArray(data) ? data : (data && (data.nhcl || data.NHCL) ? [data] : []);
  }

  aplicarFiltros() {
    this.listaFiltrada = this.listaCompleta.filter(item => {
      const valTipo = item.tipoAsegurado || item.TIPOASEGURADO;
      const valPlan = item.tipoPlan || item.TIPOPLAN;
      
      const matchFecha = !this.filtroFecha || (item.fechaIngreso || '').includes(this.filtroFecha);
      const matchTipo = !this.filtroTipo || String(valTipo) === this.filtroTipo;
      const matchPlan = !this.filtroPlan || String(valPlan) === this.filtroPlan;
      
      return matchFecha && matchTipo && matchPlan;
    });
  }

  limpiarFiltros() {
    this.filtroFecha = ''; this.filtroTipo = ''; this.filtroPlan = '';
    this.listaFiltrada = [...this.listaCompleta];
  }

  // --- GESTIÓN DE ELIMINACIÓN ---

  eliminar(item: any) {
    const nhcl = item.nhcl || item.NHCL;
    const nombre = `${item.primerNombre || ''} ${item.primerApellido || ''}`;

    this.servicio.obtenerDependientes(nhcl).subscribe({
      next: (res: any) => {
        const deps = this.extraerArray(res);
        if (deps.length > 0) {
          this.toastr.error(`No es posible eliminar: Tiene ${deps.length} dependientes asociados.`, 'Integridad');
        } else {
          this.lanzarConfirmacionToast(nhcl, nombre);
        }
      },
      error: () => this.lanzarConfirmacionToast(nhcl, nombre)
    });
  }

 private lanzarConfirmacionToast(nhcl: string, nombre: string) {
    // 1. Inyectamos el botón con un ID único para este Toast
    const idBoton = `btn-conf-${nhcl}`;
    const mensaje = `
      ¿Confirma eliminar a <b>${nombre}</b>? 
      <br><br> 
      <div class="btn-confirm-toast ${idBoton}">SÍ, ELIMINAR</div>
    `;
    
    const toast = this.toastr.warning(mensaje, 'Confirmación', {
      disableTimeOut: true,
      closeButton: true,
      enableHtml: true,
      tapToDismiss: false, // Evita cierre accidental
      toastClass: 'ngx-toastr toast-confirm-custom'
    });

   // 2. Esperamos a que el Toast esté en el DOM
    setTimeout(() => {
      // getElementsByClassName devuelve una lista, tomamos el primer elemento [0]
      const botones = document.getElementsByClassName(idBoton);
      const boton = botones[0] as HTMLElement;

      if (boton) {
        boton.onclick = (e) => {
          e.stopPropagation(); // Evita que el clic se propague al cuerpo del Toast
          this.toastr.clear(toast.toastId); 
          this.ejecutarBaja(nhcl, nombre); 
        };
      }
    }, 150); // Un pequeño margen adicional para asegurar el renderizado al 80% de zoom
  }

  private ejecutarBaja(nhcl: string, nombre: string) {
    this.cargando = true;
    this.servicio.eliminarAsegurado(nhcl).subscribe({
      next: () => {
        this.toastr.success(`Asegurado ${nombre} eliminado.`, 'Éxito');
        this.inicializarComponente();
      },
      error: (err) => {
        this.cargando = false;
        this.toastr.error(err.error?.message || 'Error al eliminar');
        this.cdr.detectChanges();
      }
    });
  }

  // --- LÓGICA DE PRESENTACIÓN DINÁMICA ---

  getBadgeClass(valor: any): string {
    if (!valor) return 'badge-default';
    const buscar = String(valor).trim();
    const tipo = this.listaTipos.find(t => String(t.PK_CODIGO) === buscar);
    const desc = tipo ? tipo.DESCRIPCION.toUpperCase() : buscar.toUpperCase();

    if (desc.includes('COLABORADOR')) return 'badge-colaborador';
    if (desc.includes('MÉDICO') || desc.includes('MEDICO')) return 'badge-medico';
    if (desc.includes('ESPECIAL')) return 'badge-especial';
    return 'badge-default';
  }

  obtenerDescripcionTipo(id: any): string {
    const encontrado = this.listaTipos.find(t => String(t.PK_CODIGO) === String(id));
    return encontrado ? encontrado.DESCRIPCION : (id || 'N/A');
  }

  obtenerDescripcionPlan(id: any): string {
    const encontrado = this.listaPlanes.find(p => String(p.CD_PLAN) === String(id));
    return encontrado ? encontrado.DESCRIPCION : (id || 'Plan General');
  }
}