import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms'; 
import { AseguradosService } from '../../services/asegurados';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dependientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './dependientes.html',
  styleUrl: './dependientes.css'
})
export class DependientesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private servicio = inject(AseguradosService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);

  asegurado: any; 
  mostrarFormulario = false;
  nhclTitular: any = '';

  listaParentescos: any[] = [];
  edadMaximaDependiente = 0; 
  cargandoCatalogos = false;

  esEdicionDependiente = false;
  nhclDependienteEditando = '';
  cargando = true;
  errorTitular = false;

  mostrarModalBusqueda = false;
  tipoBusqueda: 'cedula' | 'nombres' = 'cedula';
  criterioBusqueda = '';
  errorBusqueda = '';
  resultadosBusqueda: any[] = [];

  formDependiente: FormGroup = this.fb.group({
    nhcl: ['', Validators.required],
    primerNombre: ['', Validators.required],
    segundoNombre: [''],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    fechaNacimiento: ['', Validators.required],
    sexo: ['Masculino', Validators.required],
    parentesco: [{ value: null, disabled: true }, Validators.required],
    fechaIngreso: ['', Validators.required],
    fechaSalida: ['']
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const parametroUrl = params['nhcl'] || params['id'];
      if (parametroUrl) {
        this.nhclTitular = parametroUrl;
        this.cargarDatosIniciales();
        this.cargarDatos(this.nhclTitular);
      } else {
        this.errorTitular = true;
        this.cargando = false;
        this.toastr.error('No se proporcionó un NHCL de titular válido.');
      }
    });
  }

  // --- LÓGICA DE ELIMINACIÓN CORREGIDA ---

  eliminar(dep: any) {
    const nhclDep = dep.nhcl || dep.NHCL || dep.CD_NHCL;
    const nombre = `${dep.primerNombre || ''} ${dep.primerApellido || ''}`;
    const claseBoton = `btn-confirm-dep-${nhclDep}`;

    const mensaje = `
      ¿Eliminar al dependiente <b>${nombre}</b>? 
      <br><br> 
      <div class="${claseBoton} btn-confirm-toast">SÍ, ELIMINAR</div>
    `;
    
    const toast = this.toastr.warning(mensaje, 'Confirmar Baja', {
      disableTimeOut: true,
      closeButton: true,
      enableHtml: true,
      tapToDismiss: false,
      toastClass: 'ngx-toastr toast-confirm-custom'
    });

    // Captura específica del clic en el botón por su clase
    setTimeout(() => {
      const elementos = document.getElementsByClassName(claseBoton);
      const boton = elementos[0] as HTMLElement;

      if (boton) {
        boton.onclick = (e) => {
          e.stopPropagation(); // Evita que el clic suba al cuerpo del toast
          this.toastr.clear(toast.toastId);
          this.ejecutarEliminacion(nhclDep, nombre);
        };
      }
    }, 150);
  }

  private ejecutarEliminacion(nhcl: string, nombre: string) {
    this.servicio.eliminarDependiente(this.nhclTitular, nhcl).subscribe({
      next: () => {
        this.toastr.success(`${nombre} ha sido removido.`, 'Éxito');
        this.cargarDependientes(this.nhclTitular);
      },
      error: () => this.toastr.error('No se pudo completar la eliminación.')
    });
  }

  // --- MÉTODOS DE CARGA Y GUARDADO ---

  cargarDatosIniciales() {
    this.cargando = true;
    forkJoin({
      parentescos: this.servicio.obtenerCatalogoParentescos().pipe(catchError(() => of([]))),
      config: this.servicio.obtenerParametrosEdades().pipe(catchError(() => of({ EDAD_MAX_DEPENDIENTE: 18 })))
    }).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe(res => {
      this.listaParentescos = res.parentescos;
      this.edadMaximaDependiente = Number(res.config.EDAD_MAX_DEPENDIENTE || res.config.EDAD_MAX_DEPEDNEINTE || 18);
      this.formDependiente.get('parentesco')?.enable();
    });
  }

  cargarDatos(nhcl: string) {
    this.cargando = true;
    this.servicio.obtenerPorNhcl(nhcl).subscribe({
      next: (respuesta: any) => {
        let data = respuesta?.data || respuesta?.datos || respuesta;
        if (Array.isArray(data)) data = data[0]; 
        if (data && (data.nhcl || data.NHCL)) {
          this.asegurado = data;
          this.cargarDependientes(nhcl);
        } else {
          this.errorTitular = true;
          this.cargando = false;
        }
      },
      error: () => {
        this.errorTitular = true;
        this.cargando = false;
        this.toastr.error('Error al recuperar datos del titular.');
      }
    });
  }

  cargarDependientes(nhcl: string) {
    this.servicio.obtenerDependientes(nhcl).subscribe({
      next: (respuesta: any) => {
        this.cargando = false;
        let arrayExtraido = this.extraerArray(respuesta);
        if (this.asegurado) this.asegurado.dependientes = arrayExtraido;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.toastr.warning('No se pudieron cargar los dependientes.');
      }
    });
  }

  guardar() {
    const datosFormulario = this.formDependiente.getRawValue();

    if (datosFormulario.nhcl === this.nhclTitular) {
      this.toastr.error('El dependiente no puede tener el mismo NHCL que el titular.', 'Validación');
      return;
    }

    if (datosFormulario.parentesco && datosFormulario.fechaNacimiento) {
      const parentesco = this.listaParentescos.find(p => String(p.CD_PARENTESCO) === String(datosFormulario.parentesco));
      if (parentesco && String(parentesco.DESCRIPCION).toUpperCase().trim() === 'HIJO') {
        const edad = this.calcularEdad(datosFormulario.fechaNacimiento);
        if (edad > this.edadMaximaDependiente) {
          this.toastr.error(`Límite superado: ${edad} años. Máximo permitido: ${this.edadMaximaDependiente}.`, 'Regla de Negocio');
          return;
        }
      }
    }

    if (this.formDependiente.invalid) {
      this.toastr.warning('Complete los campos obligatorios.');
      this.formDependiente.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const peticion = this.esEdicionDependiente 
        ? this.servicio.actualizarDependiente(this.nhclTitular, this.nhclDependienteEditando, datosFormulario)
        : this.servicio.agregarDependiente(this.nhclTitular, datosFormulario);

    peticion.subscribe({
      next: () => {
        this.toastr.success('Guardado correctamente.', 'Oracle');
        this.cargarDependientes(this.nhclTitular);
        this.cancelarEdicion();
      },
      error: (err) => {
        this.cargando = false;
        this.toastr.error(err.error?.message || 'Error al procesar.');
      }
    });
  }

  // --- OTROS MÉTODOS ---

  seleccionarDependiente(persona: any) {
    const nhclSel = persona.nhcl || persona.NHCL || persona.cedula || '';
    if (nhclSel === this.nhclTitular) {
      this.toastr.warning('No puede registrar al titular como dependiente.');
      return; 
    }
    this.formDependiente.patchValue({
      nhcl: nhclSel,
      primerNombre: persona.primerNombre || persona.PRIMERNOMBRE || '',
      segundoNombre: persona.segundoNombre || persona.SEGUNDONOMBRE || '',
      primerApellido: persona.primerApellido || persona.PRIMERAPELLIDO || '',
      segundoApellido: persona.segundoApellido || persona.SEGUNDOAPELLIDO || '',
      fechaNacimiento: this.formatearFecha(persona.fechaNacimiento || persona.FECHANACIMIENTO),
      sexo: persona.sexo || persona.SEXO || 'Masculino'
    });
    this.bloquearCamposPersonales();
    this.toastr.info('Datos importados.');
    this.cerrarModalBusqueda(); 
  }

  buscarExterno() {
    if (!this.criterioBusqueda.trim()) return;
    this.servicio.buscarDependienteEnBaseExterna(this.criterioBusqueda, this.tipoBusqueda).subscribe({
      next: (res: any) => {
        let data = res?.data || res?.datos || res;
        this.resultadosBusqueda = Array.isArray(data) ? data : (data ? [data] : []);
        if (this.resultadosBusqueda.length === 0) this.toastr.info('Sin resultados.');
        this.cdr.detectChanges(); 
      },
      error: () => this.toastr.error('Error en búsqueda externa.')
    });
  }

  prepararEdicion(dep: any) {
    this.esEdicionDependiente = true;
    this.nhclDependienteEditando = dep.nhcl || dep.NHCL;
    this.mostrarFormulario = true;
    const match = this.listaParentescos.find(p => String(p.CD_PARENTESCO).trim() === String(dep.CD_PARENTESCO).trim());
    this.formDependiente.patchValue({
      nhcl: this.nhclDependienteEditando,
      primerNombre: dep.primerNombre || dep.PRIMERNOMBRE || '',
      segundoNombre: dep.segundoNombre || dep.SEGUNDONOMBRE || '',
      primerApellido: dep.primerApellido || dep.PRIMERAPELLIDO || '',
      segundoApellido: dep.segundoApellido || dep.SEGUNDOAPELLIDO || '',
      fechaNacimiento: this.formatearFecha(dep.fechaNacimiento || dep.FECHANACIMIENTO),
      sexo: dep.sexo || dep.SEXO || 'Masculino',
      parentesco: match ? match.CD_PARENTESCO : null,
      fechaIngreso: this.formatearFecha(dep.fechaIngreso || dep.FECHAINGRESO),
      fechaSalida: this.formatearFecha(dep.fechaSalida || dep.FECHASALIDA)
    });
    this.bloquearCamposPersonales();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private extraerArray(data: any): any[] { let res = data?.data || data?.datos || data?.resultados || data; return Array.isArray(res) ? res : (res && (res.nhcl || res.NHCL) ? [res] : []); }
  cancelarEdicion() { this.esEdicionDependiente = false; this.mostrarFormulario = false; this.formDependiente.reset({ sexo: 'Masculino' }); this.desbloquearCamposPersonales(); }
  calcularEdad(f: string): number { const hoy = new Date(); const c = new Date(f); let e = hoy.getFullYear() - c.getFullYear(); if (hoy.getMonth() < c.getMonth() || (hoy.getMonth() === c.getMonth() && hoy.getDate() < c.getDate())) e--; return e; }
  formatearFecha(f: any): string { if (!f) return ''; let d = String(f).split('T')[0].split(' ')[0]; if (d.includes('/')) { const p = d.split('/'); return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`; } return d.substring(0, 10); }
  toggleFormulario() { this.mostrarFormulario = !this.mostrarFormulario; if (!this.mostrarFormulario) this.cancelarEdicion(); }
  abrirModalBusqueda() { this.mostrarModalBusqueda = true; this.criterioBusqueda = ''; this.resultadosBusqueda = []; }
  cerrarModalBusqueda() { this.mostrarModalBusqueda = false; }
  bloquearCamposPersonales() { ['nhcl','primerNombre','segundoNombre','primerApellido','segundoApellido','fechaNacimiento','sexo'].forEach(c => this.formDependiente.get(c)?.disable()); }
  desbloquearCamposPersonales() { ['nhcl','primerNombre','segundoNombre','primerApellido','segundoApellido','fechaNacimiento','sexo'].forEach(c => this.formDependiente.get(c)?.enable()); }
}