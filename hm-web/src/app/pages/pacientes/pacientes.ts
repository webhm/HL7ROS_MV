import { Component, inject } from '@angular/core';
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

  cedulaBusqueda: string = '';
  pacienteEncontrado: PacienteHis | null = null;
  buscando = false;
  enviando = false;
  mensajeFeedback = '';

  buscar() {
    if (!this.cedulaBusqueda) return;
    
    this.buscando = true;
    this.pacienteEncontrado = null;
    this.mensajeFeedback = '';

    this.integracionService.buscarPacientePorCedula(this.cedulaBusqueda).subscribe({
      next: (res: any) => {
        // 1. Imprimimos en consola para ver exactamente qué devolvió el API (Presiona F12 en tu navegador)
        console.log('Respuesta cruda del API:', res);

        // 2. Verificamos si el API devolvió un Arreglo (toma el primero) o un Objeto
        const data = Array.isArray(res) ? res[0] : res;

        if (data) {
          // 3. MAPEO ROBUSTO: Lee tanto las variables camelCase como las de base de datos (MAYÚSCULAS)
          this.pacienteEncontrado = {
            cdPaciente: data.cdPaciente || data.CD_PACIENTE || data.cdAtencion || 'Sin ID',
            cedulaPaciente: data.cedulaPaciente || data.CD_IDENTIFICADOR_PESSOA || data.cedula || this.cedulaBusqueda,
            nombresPaciente: data.nombresPaciente || data.NM_PACIENTE || data.nombres || data.nombre || '',
            apellidosPaciente: data.apellidosPaciente || data.DS_SEGUNDO_SOBRENOME || data.apellidos || '',
            fechaNacimiento: data.fechaNacimiento || data.DT_NASCIMENTO || data.fecha || '',
            sexo: data.sexo || data.TP_SEXO || data.genero || ''
          };

          // Si el API devuelve un solo string combinado para el nombre (ej. NM_PACIENTE completo)
          if (!this.pacienteEncontrado.apellidosPaciente && this.pacienteEncontrado.nombresPaciente) {
             // Dejamos que muestre todo en la variable nombres
          }

        } else {
          this.mensajeFeedback = 'No se encontró ningún paciente con esa cédula en el HIS.';
        }
        
        this.buscando = false;
      },
      error: (err) => {
        console.error('Error de HTTP al buscar paciente:', err);
        this.mensajeFeedback = 'Error de conexión con el HIS o endpoint incorrecto.';
        this.buscando = false;
      }
    });
  }

  enviarHl7() {
    if (!this.pacienteEncontrado) return;

    this.enviando = true;
    this.integracionService.enviarMensajeDemanda(this.pacienteEncontrado).subscribe({
      next: () => {
        this.enviando = false;
        alert('Mensaje HL7 enviado exitosamente al RIS.');
      },
      error: (err) => {
        console.error('Error al enviar:', err);
        this.enviando = false;
        alert('Error al procesar el envío HL7.');
      }
    });
  }

  limpiar() {
    this.cedulaBusqueda = '';
    this.pacienteEncontrado = null;
    this.mensajeFeedback = '';
  }
}