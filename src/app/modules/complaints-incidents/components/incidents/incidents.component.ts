import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IncidentsService } from '../../services/incidents.service';
import { IncidentReportService } from '../../services/incident-report.service';
import { Incident, IncidentType } from '../../models/complaints-incidents.models';
import { IncidentFormModalComponent } from '../incident-form-modal/incident-form-modal.component';
import { IncidentTypesService } from '../../services/incident-types.service';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-incidents',
  templateUrl: './incidents.component.html',
  styleUrls: ['./incidents.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule
  ]
})
export class IncidentsComponent implements OnInit {
  incidents: Incident[] = [];
  incidentTypes: IncidentType[] = [];
  showInactive = false;

  constructor(
    private incidentsService: IncidentsService,
    private incidentTypesService: IncidentTypesService,
    private reportService: IncidentReportService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadIncidents();
    this.incidentTypesService.getAll().subscribe({
      next: (types) => { this.incidentTypes = types; },
      error: (err: any) => { console.error('Error loading incident types:', err); }
    });
  }

  loadIncidents(): void {
    this.incidentsService.getAll().subscribe({
      next: (incidents) => {
        // No modificar las fechas aquí, dejar que el servicio de reportes las maneje
        this.incidents = incidents;
      },
      error: (error: any) => {
        console.error('Error loading incidents:', error);
      }
    });
  }

  toggleShowInactive(): void {
    this.showInactive = !this.showInactive;
  }

  getIncidentsList(): Incident[] {
    return this.showInactive
      ? this.incidents.filter(i => i.recordStatus === 'INACTIVE')
      : this.incidents.filter(i => i.recordStatus === 'ACTIVE' || !i.recordStatus);
  }

  openIncidentForm(incident?: Incident): void {
    const dialogRef = this.dialog.open(IncidentFormModalComponent, {
      width: '600px',
      data: { incident: incident }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.loadIncidents();
        this.showSuccessAlert('Operación completada con éxito');
      }
    });
  }

  deleteIncident(id: string): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.incidentsService.getById(id).subscribe({
          next: (incident) => {
            const updatedIncident = { ...incident, recordStatus: 'INACTIVE' as const };
            this.incidentsService.update(id, updatedIncident).subscribe({
              next: () => {
                this.loadIncidents();
                this.showSuccessAlert('Incidencia eliminada con éxito.');
              },
              error: (error: any) => {
                console.error('Error eliminando incidencia:', error);
                this.showErrorAlert('Error eliminando incidencia.');
              }
            });
          },
          error: (error: any) => {
            console.error('Error obteniendo incidencia para eliminar:', error);
            this.showErrorAlert('Error obteniendo incidencia para eliminar.');
          }
        });
      }
    });
  }

  restoreIncident(id: string): void {
    Swal.fire({
      title: '¿Estás seguro de restaurar?',
      text: 'La incidencia volverá a estar activa.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar!'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.incidentsService.getById(id).subscribe({
          next: (incident) => {
            const updatedIncident = { ...incident, recordStatus: 'ACTIVE' as const };
            this.incidentsService.update(id, updatedIncident).subscribe({
              next: () => {
                this.loadIncidents();
                this.showSuccessAlert('Incidencia restaurada con éxito.');
              },
              error: (error: any) => {
                console.error('Error restaurando incidencia:', error);
                this.showErrorAlert('Error restaurando incidencia.');
              }
            });
          },
          error: (error: any) => {
            console.error('Error obteniendo incidencia para restaurar:', error);
            this.showErrorAlert('Error obteniendo incidencia para restaurar.');
          }
        });
      }
    });
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      case 'CRITICAL': return 'Crítica';
      default: return severity;
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'REPORTED': return 'Reportado';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'RESOLVED': return 'Resuelto';
      case 'CLOSED': return 'Cerrado';
      default: return status;
    }
  }

  // Nuevo método para determinar el estado de resolución basándose en el campo resolved
  getResolutionStatus(incident: Incident): string {
    return incident.resolved === true ? 'Resuelto' : 'No Resuelto';
  }

  // Nuevo método para obtener las clases CSS del estado de resolución
  getResolutionStatusClass(incident: Incident): string {
    if (incident.resolved === true) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  }

  isNumber(value: any): value is number {
    return typeof value === 'number';
  }

  getIncidentTypeName(typeId: string): string {
    return this.incidentTypes.find(type => type.id === typeId)?.typeName || '-';
  }

  async viewIncidentDetails(incident: Incident): Promise<void> {
    console.log('Viewing details for incident:', incident);
    console.log('Incident Type ID to look up:', incident.incidentTypeId);
    const type = this.incidentTypes.find(t => t.id === incident.incidentTypeId);
    console.log('Found Incident Type object:', type);

    const { IncidentDetailsModalComponent } = await import('../incident-details-modal.component');
    this.dialog.open(
      IncidentDetailsModalComponent,
      {
        width: 'auto',
        maxHeight: '90vh',
        data: {
          ...incident,
          incidentType: type?.typeName || '-',
          estimatedResolutionTime: type?.estimatedResolutionTime || '-',
          priorityLevel: type?.priorityLevel || '-',
        }
      }
    );
  }

  generateMassiveReport(): void {
    try {
      const activeIncidents = this.getIncidentsList();
      if (activeIncidents.length === 0) {
        this.showErrorAlert('No hay incidencias para generar el reporte');
        return;
      }

      this.reportService.generateMassiveIncidentsReport(activeIncidents, this.incidentTypes);
      this.showSuccessAlert('Reporte masivo PDF generado exitosamente');
    } catch (error) {
      console.error('Error generating massive report:', error);
      this.showErrorAlert('Error al generar el reporte masivo PDF');
    }
  }

  async openCustomReportModal(): Promise<void> {
    const activeIncidents = this.getIncidentsList();
    if (activeIncidents.length === 0) {
      this.showErrorAlert('No hay incidencias para generar el reporte');
      return;
    }

    const { ReportConfigModalComponent } = await import('../report-config-modal/report-config-modal.component');
    const dialogRef = this.dialog.open(ReportConfigModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { incidents: activeIncidents }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.showSuccessAlert('Reporte personalizado generado exitosamente');
      }
    });
  }

  private showSuccessAlert(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
      confirmButtonColor: '#4CAF50',
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        actions: 'swal2-actions',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
        icon: 'swal2-icon'
      }
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonColor: '#F44336',
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        actions: 'swal2-actions',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel'
      }
    });
  }
}