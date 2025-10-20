import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatNativeDateModule } from '@angular/material/core';
import { IncidentReportService } from '../../services/incident-report.service';
import { Incident } from '../../models/complaints-incidents.models';

interface ReportConfig {
  dateFrom?: Date;
  dateTo?: Date;
  severities: string[];
  statuses: string[];
  categories: string[];
  includeResolved: boolean;
  includeUnresolved: boolean;
  sortBy: 'date' | 'severity' | 'status' | 'code';
  groupBy: 'none' | 'severity' | 'status' | 'category';
}

@Component({
  selector: 'app-report-config-modal',
  templateUrl: './report-config-modal.component.html',
  styleUrls: ['./report-config-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    MatNativeDateModule
  ]
})
export class ReportConfigModalComponent {
  config: ReportConfig = {
    severities: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    statuses: ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    categories: ['GENERAL', 'CALIDAD', 'DISTRIBUCION'],
    includeResolved: true,
    includeUnresolved: true,
    sortBy: 'date',
    groupBy: 'none'
  };

  severityOptions = [
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'CRITICAL', label: 'Crítica' }
  ];

  statusOptions = [
    { value: 'REPORTED', label: 'Reportado' },
    { value: 'IN_PROGRESS', label: 'En Progreso' },
    { value: 'RESOLVED', label: 'Resuelto' },
    { value: 'CLOSED', label: 'Cerrado' }
  ];

  categoryOptions = [
    { value: 'GENERAL', label: 'General' },
    { value: 'CALIDAD', label: 'Calidad del Agua' },
    { value: 'DISTRIBUCION', label: 'Distribución' }
  ];

  sortOptions = [
    { value: 'date', label: 'Fecha' },
    { value: 'severity', label: 'Severidad' },
    { value: 'status', label: 'Estado' },
    { value: 'code', label: 'Código' }
  ];

  groupOptions = [
    { value: 'none', label: 'Sin Agrupación' },
    { value: 'severity', label: 'Por Severidad' },
    { value: 'status', label: 'Por Estado' },
    { value: 'category', label: 'Por Categoría' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ReportConfigModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { incidents: Incident[] },
    private reportService: IncidentReportService
  ) {}

  onSeverityChange(severity: string, checked: boolean): void {
    if (checked) {
      if (!this.config.severities.includes(severity)) {
        this.config.severities.push(severity);
      }
    } else {
      const index = this.config.severities.indexOf(severity);
      if (index > -1) {
        this.config.severities.splice(index, 1);
      }
    }
  }

  onStatusChange(status: string, checked: boolean): void {
    if (checked) {
      if (!this.config.statuses.includes(status)) {
        this.config.statuses.push(status);
      }
    } else {
      const index = this.config.statuses.indexOf(status);
      if (index > -1) {
        this.config.statuses.splice(index, 1);
      }
    }
  }

  onCategoryChange(category: string, checked: boolean): void {
    if (checked) {
      if (!this.config.categories.includes(category)) {
        this.config.categories.push(category);
      }
    } else {
      const index = this.config.categories.indexOf(category);
      if (index > -1) {
        this.config.categories.splice(index, 1);
      }
    }
  }

  isSelected(array: string[], value: string): boolean {
    return array.includes(value);
  }

  generateCustomReport(): void {
    const filteredIncidents = this.filterIncidents();
    
    if (filteredIncidents.length === 0) {
      // Show error message - no incidents match criteria
      return;
    }

    this.reportService.generateCustomIncidentsReport(filteredIncidents, this.config);
    this.dialogRef.close(true);
  }

  private filterIncidents(): Incident[] {
    return this.data.incidents.filter(incident => {
      // Filter by severity
      if (!this.config.severities.includes(incident.severity)) {
        return false;
      }

      // Filter by status
      if (!this.config.statuses.includes(incident.status)) {
        return false;
      }

      // Filter by category
      if (!this.config.categories.includes(incident.incidentCategory)) {
        return false;
      }

      // Filter by resolved status
      if (incident.resolved && !this.config.includeResolved) {
        return false;
      }
      if (!incident.resolved && !this.config.includeUnresolved) {
        return false;
      }

      // Filter by date range
      if (this.config.dateFrom || this.config.dateTo) {
        const incidentDate = new Date(incident.incidentDate);
        
        if (this.config.dateFrom && incidentDate < this.config.dateFrom) {
          return false;
        }
        
        if (this.config.dateTo && incidentDate > this.config.dateTo) {
          return false;
        }
      }

      return true;
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
