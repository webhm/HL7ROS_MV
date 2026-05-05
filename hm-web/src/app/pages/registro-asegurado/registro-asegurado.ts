import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'; 
import { AseguradosService } from '../../services/asegurados';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-registro-asegurado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule], 
  templateUrl: './registro-asegurado.html',
  styleUrl: './registro-asegurado.css'
})
export class RegistroAseguradoComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private servicio = inject(AseguradosService);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService); // <-- Inyección de Toastr

  formulario: FormGroup = this.fb.group({
    nhcl: ['', Validators.required],
    primerNombre: ['', Validators.required],
    segundoNombre: [''],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    fechaIngreso: ['', Validators.required],
    fechaSalida: [''],
    // Inicializados deshabilitados hasta que carguen los catálogos
    tipoPlan: [{ value: null, disabled: true }, Validators.required],
    tipoAsegurado: [{ value: null, disabled: true }, Validators.required]
  });

  esEdicion = false;
  nhclEditar: string | null = null; 
  listaTipos: any[] = [];
  listaPlanes: any[] = [];
  cargando = false;

  // --- VARIABLES DEL MODAL DE BÚSQUEDA ---
  mostrarModal = false;
  tipoBusqueda: 'cedula' | 'nombres' = 'cedula';
  criterioBusqueda = '';
  errorBusqueda = '';
  resultadosBusqueda: any[] = [];

  ngOnInit() {
    this.route.params.subscribe(params => {
      const parametroUrl = params['nhcl'] || params['id']; 

      if (parametroUrl) {
        this.esEdicion = true;
        this.nhclEditar = parametroUrl;
        this.cargarDatosEdicion(parametroUrl);
      } else {
        this.cargarCatalogos();
      }
    });
  }

  cargarDatosEdicion(nhcl: string) {
    this.cargando = true;
    forkJoin({
      tipos: this.servicio.obtenerCatalogoTipos().pipe(catchError(() => of([]))),
      planes: this.servicio.obtenerCatalogoPlanes().pipe(catchError(() => of([]))),
      asegurado: this.servicio.obtenerPorNhcl(nhcl)
    }).pipe(
      finalize(() => {
        this.cargando = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res) => {
        this.listaTipos = res.tipos;
        this.listaPlanes = res.planes;

        // Habilitar selectores
        this.formulario.get('tipoPlan')?.enable();
        this.formulario.get('tipoAsegurado')?.enable();

        let data = res.asegurado.data || res.asegurado.datos || res.asegurado;
        if (Array.isArray(data)) data = data[0];

        if (data) {
          const tipoEncontrado = this.listaTipos.find(t => 
            String(t.DESCRIPCION).trim().toUpperCase() === String(data.tipoAsegurado || data.TIPOASEGURADO).trim().toUpperCase()
          );
          const planEncontrado = this.listaPlanes.find(p => 
            String(p.DESCRIPCION).trim().toUpperCase() === String(data.tipoPlan || data.TIPOPLAN).trim().toUpperCase()
          );

          this.formulario.patchValue({
            nhcl: data.nhcl || data.NHCL || data.CD_NHCL || '',
            primerNombre: data.primerNombre || data.PRIMERNOMBRE || data.NM_PRIMER || '',
            segundoNombre: data.segundoNombre || data.SEGUNDONOMBRE || data.NM_SEGUNDO || '',
            primerApellido: data.primerApellido || data.PRIMERAPELLIDO || data.AP_PRIMER || '',
            segundoApellido: data.segundoApellido || data.SEGUNDOAPELLIDO || data.AP_SEGUNDO || '',
            fechaIngreso: this.formatearFecha(data.fechaIngreso || data.FECHAINGRESO || data.DT_INGRESO),
            fechaSalida: this.formatearFecha(data.fechaSalida || data.FECHASALIDA || data.DT_SALIDA),
            tipoAsegurado: tipoEncontrado ? tipoEncontrado.PK_CODIGO : null,
            tipoPlan: planEncontrado ? planEncontrado.CD_PLAN : null
          });

          this.bloquearCamposPersonales();
        }
      },
      error: () => {
        this.toastr.error('Error al cargar la información del asegurado.', 'Error de Carga');
        this.router.navigate(['/asegurados']);
      }
    });
  }

  cargarCatalogos() {
    this.cargando = true;
    forkJoin({
      tipos: this.servicio.obtenerCatalogoTipos().pipe(catchError(() => of([]))),
      planes: this.servicio.obtenerCatalogoPlanes().pipe(catchError(() => of([])))
    }).pipe(finalize(() => this.cargando = false))
    .subscribe(res => {
      this.listaTipos = res.tipos;
      this.listaPlanes = res.planes;
      this.formulario.get('tipoPlan')?.enable();
      this.formulario.get('tipoAsegurado')?.enable();
    });
  }

  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    return String(fecha).substring(0, 10);
  }

  guardar() {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.toastr.warning('Por favor, complete los campos obligatorios.', 'Formulario Inválido');
      return;
    }

    const datosFormulario = this.formulario.getRawValue(); 

    if (this.esEdicion) {
      this.ejecutarGuardado(datosFormulario);
    } else {
      // Validación previa de NHCL Duplicado
      this.servicio.obtenerPorNhcl(datosFormulario.nhcl).subscribe({
        next: (respuesta: any) => {
          let data = respuesta?.data || respuesta?.datos || respuesta;
          if (Array.isArray(data)) data = data[0]; 

          if (data && (data.nhcl || data.NHCL)) {
            this.toastr.error(`El NHCL ${datosFormulario.nhcl} ya está registrado como titular.`, 'NHCL Duplicado');
          } else {
            this.ejecutarGuardado(datosFormulario);
          }
        },
        error: () => this.ejecutarGuardado(datosFormulario)
      });
    }
  }

  private ejecutarGuardado(datosFormulario: any) {
    const peticion = this.esEdicion 
      ? this.servicio.actualizarAsegurado(this.nhclEditar!, datosFormulario)
      : this.servicio.agregarAsegurado(datosFormulario);
      
    peticion.subscribe({
      next: () => {
        this.toastr.success('Registro guardado correctamente.', '¡Éxito!');
        this.router.navigate(['/asegurados']);
      },
      error: (err) => {
        const msg = err?.message || 'Error al procesar la solicitud.';
        this.toastr.error(msg, 'Error al Guardar');
      }
    });
  }

  // --- MÉTODOS DE APOYO ---
  bloquearCamposPersonales() {
    const campos = ['nhcl', 'primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'];
    campos.forEach(c => this.formulario.get(c)?.disable());
  }

  abrirModal() { 
    this.mostrarModal = true; 
    this.criterioBusqueda = ''; 
    this.resultadosBusqueda = []; 
  }
  
  cerrarModal() { this.mostrarModal = false; }
  
  buscar() {
    if (!this.criterioBusqueda.trim()) return;
    this.servicio.buscarEnBaseExterna(this.criterioBusqueda, this.tipoBusqueda).subscribe({
      next: (res: any) => {
        let data = res?.data || res?.datos || res;
        this.resultadosBusqueda = Array.isArray(data) ? data : (data ? [data] : []);
        if (this.resultadosBusqueda.length === 0) this.toastr.info('No se encontraron resultados.');
        this.cdr.detectChanges();
      },
      error: () => this.toastr.error('Error al conectar con la base de datos externa.')
    });
  }

  seleccionarPersona(persona: any) {
    this.formulario.patchValue({
      nhcl: persona.nhcl || persona.NHCL || '',
      primerNombre: persona.primerNombre || persona.PRIMERNOMBRE || '',
      segundoNombre: persona.segundoNombre || persona.SEGUNDONOMBRE || '',
      primerApellido: persona.primerApellido || persona.PRIMERAPELLIDO || '',
      segundoApellido: persona.segundoApellido || persona.SEGUNDOAPELLIDO || '',
      fechaIngreso: this.formatearFecha(persona.fechaIngreso || persona.FECHAINGRESO)
    });
    this.bloquearCamposPersonales();
    this.toastr.info('Datos importados correctamente.');
    this.cerrarModal(); 
  }

  cancelar() { this.router.navigate(['/asegurados']); }
}