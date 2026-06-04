import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegracionHl7Service, PacienteHis } from '../../services/integracion-hl7';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.html',
  styleUrls: ['./pacientes.css']
})
export class PacientesComponent {
  private integracionService = inject(IntegracionHl7Service);
  private cdr = inject(ChangeDetectorRef);

  cedulaBusqueda: string = '';
  pacienteEncontrado: PacienteHis | null = null;
  
  buscando = false;
  enviando = false;
  mensajeFeedback = '';
  tipoAlerta: 'info' | 'error' | 'success' = 'info';

  buscar(): void {
    if (!this.cedulaBusqueda || this.cedulaBusqueda.trim() === '') return;
    
    try {
      this.buscando = true;
      this.pacienteEncontrado = null;
      this.mensajeFeedback = '';
      this.cdr.detectChanges(); 

      this.integracionService.buscarPacientePorCedula(this.cedulaBusqueda).subscribe({
        next: (res: any) => {
          this.buscando = false;
          this.cdr.detectChanges(); 

          try {
            const data = Array.isArray(res) ? res[0] : (res?.data || res);

            if (data && (data.cedulaPaciente || data.CD_PACIENTE || data.cdPaciente || data.IDENTIFICACION)) {
              
              const fechaCruda = data.fechaNacimiento || data.DT_NASCIMENTO || data.fecha || data.FECHA_NACIMIENTO || '';
              // Reemplazamos la lógica anterior por nuestro nuevo método formateador
              const fechaLimpia = this.limpiarFormatoFecha(fechaCruda);

              this.pacienteEncontrado = {
                cdPaciente: data.cdPaciente || data.CD_PACIENTE || data.cdAtencion || 'N/A',
                cedulaPaciente: data.cedulaPaciente || data.CD_IDENTIFICADOR_PESSOA || data.cedula || data.IDENTIFICACION || this.cedulaBusqueda,
                nombresPaciente: data.nombresPaciente || data.NM_PACIENTE || data.nombres || data.NOMBRES || '',
                apellidosPaciente: data.apellidosPaciente || data.DS_SEGUNDO_SOBRENOME || data.apellidos || data.APELLIDOS || '',
                fechaNacimiento: fechaLimpia,
                sexo: data.sexo || data.TP_SEXO || data.genero || data.GENERO || '',
                direccion: data.direccion || data.DS_ENDERECO || data.DIRECCION || '',
                celular: data.celular || data.NR_CELULAR || data.CELULAR || ''
              };
            } else {
              this.mostrarAlerta('No se encontró ningún paciente con esa identificación en el HIS.', 'info');
            }
          } catch (e) {
            this.mostrarAlerta('Error interno al leer los datos del paciente.', 'error');
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.buscando = false;
          this.mostrarAlerta('Error de conexión con el HIS o el paciente no existe.', 'error');
          this.cdr.detectChanges();
        },
        complete: () => {
          this.buscando = false;
          this.cdr.detectChanges();
        }
      });
    } catch (errorCritico) {
      this.buscando = false;
      this.cdr.detectChanges();
    }
  }

  enviarHl7(): void {
    if (!this.pacienteEncontrado) return;

    // Activamos el estado de carga
    this.enviando = true;
    this.mensajeFeedback = '';
    this.cdr.detectChanges();

    this.integracionService.enviarMensajeDemanda(this.pacienteEncontrado).subscribe({
        next: (res) => {
          console.log('[DEBUG] Respuesta de envío HL7:', res);
          this.enviando = false;
          this.mostrarAlerta('¡Mensaje HL7 enviado exitosamente a la cola del RIS!', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('[DEBUG] Error al enviar HL7:', err);
          this.enviando = false;
          this.mostrarAlerta('Error al intentar enviar el mensaje HL7.', 'error');
          this.cdr.detectChanges();
        },
        complete: () => {
          this.enviando = false;
          this.cdr.detectChanges();
        }
    });
  }

  limpiar(): void {
    this.cedulaBusqueda = '';
    this.pacienteEncontrado = null;
    this.mensajeFeedback = '';
    this.cdr.detectChanges();
  }

  private mostrarAlerta(mensaje: string, tipo: 'info' | 'error' | 'success'): void {
    this.mensajeFeedback = mensaje;
    this.tipoAlerta = tipo;
  }

  /**
   * Procesa la fecha cruda del HIS y la formatea a DD/MM/YYYY.
   * Maneja formatos ISO con 'T' y cadenas numéricas 'YYYYMMDD'.
   */
  private limpiarFormatoFecha(fechaCruda: any): string {
    if (!fechaCruda) return '';
    
    // Aseguramos que sea string para evitar errores con métodos de cadena
    const fechaStr = String(fechaCruda).trim();

    // 1. Caso: Formato YYYYMMDD continuo (Ej: "19930108")
    // Verificamos longitud 8 y que contenga solo números
    if (fechaStr.length === 8 && /^\d+$/.test(fechaStr)) {
      const anio = fechaStr.substring(0, 4);
      const mes = fechaStr.substring(4, 6);
      const dia = fechaStr.substring(6, 8);
      return `${dia}/${mes}/${anio}`;
    }

    // 2. Caso: Formato ISO (Ej: "1993-01-08T00:00:00")
    if (fechaStr.includes('T')) {
      const soloFecha = fechaStr.split('T')[0]; // Se queda con "1993-01-08"
      const partes = soloFecha.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`; // DD/MM/YYYY
      }
    }

    // 3. Caso: Formato YYYY-MM-DD sin la 'T'
    if (fechaStr.includes('-') && fechaStr.length === 10) {
      const partes = fechaStr.split('-');
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // Si no coincide con ninguno de los patrones esperados, retorna tal cual
    return fechaStr;
  }
}