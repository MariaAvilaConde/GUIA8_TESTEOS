import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Incident, IncidentResolution } from '../models/complaints-incidents.models';
import { IncidentResolutionsService } from '../services/incident-resolutions.service';
import { IncidentReportService } from '../services/incident-report.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClientsService, ClientData } from '../services/clients.service';
import { UserResponseDTO } from '../../../core/models/user.model';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductResponse } from '../../../core/models/inventory.model';

interface IncidentDetailsData {
  id?: string;
  organizationId: string;
  incidentCode: string;
  incidentTypeId: string;
  incidentCategory: 'GENERAL' | 'CALIDAD' | 'DISTRIBUCION';
  zoneId: string;
  incidentDate: number; // timestamp (milisegundos)
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  affectedBoxesCount: number;
  reportedByUserId: string;
  assignedToUserId?: string;
  resolvedByUserId?: string;
  resolved: boolean;
  resolutionNotes?: string;
  recordStatus: 'ACTIVE' | 'INACTIVE';
  incidentType: string;
  estimatedResolutionTime: string;
  priorityLevel: string;
}

@Component({
  selector: 'app-incident-details-modal',
  templateUrl: './incident-details-modal.component.html',
  styleUrls: ['./incident-details-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  providers: [IncidentResolutionsService, IncidentReportService, ClientsService]
})
export class IncidentDetailsModalComponent {
  resolutionDetails: IncidentResolution | null = null;
  isResolutionLoading: boolean = false;
  isGeneratingReport: boolean = false;
  clientUsers: ClientData[] = [];
  products: ProductResponse[] = [];

  constructor(
    public dialogRef: MatDialogRef<IncidentDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IncidentDetailsData,
    private resolutionService: IncidentResolutionsService, // Inject the service
    private reportService: IncidentReportService, // Inject the report service
    private clientsService: ClientsService,
    private inventoryService: InventoryService
  ) {
    console.log('IncidentDetailsModalComponent opened with data:', this.data);
    console.log('Incident resolved status:', this.data.resolved);
    this.loadUsers();
    this.loadProducts();
    if (this.data.resolved) {
      this.loadResolutionDetails();
    }
  }

  loadUsers(): void {
    console.log('🔄 Loading users for organization:', this.data.organizationId);
    this.clientsService.getAllClients(this.data.organizationId).subscribe({
      next: (clients: ClientData[]) => {
        console.log('✅ Clientes cargados:', clients.length);
        this.clientUsers = clients;
      },
      error: (err: any) => {
        console.error('❌ Error fetching client users', err);
      }
    });
  }

  loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (products: ProductResponse[]) => {
        this.products = products;
      },
      error: (err: any) => {
        console.error('Error fetching products', err);
      }
    });
  }

  getUsernameById(id: string): string {
    const user = this.clientUsers.find(u => u.id === id);
    return user ? `${user.firstName} ${user.lastName}` : id;
  }

  getProductNameById(id: string): string {
    const product = this.products.find(p => p.productId === id);
    return product ? product.productName : `Producto ID: ${id}`;
  }

  getResolutionDate(): Date | null {
    if (this.resolutionDetails && typeof this.resolutionDetails.resolutionDate === 'number' && this.resolutionDetails.resolutionDate > 0) {
      // Si el timestamp es muy pequeño, probablemente esté en segundos, no en milisegundos
      const timestampMs = this.resolutionDetails.resolutionDate < 1000000000000
        ? this.resolutionDetails.resolutionDate * 1000
        : this.resolutionDetails.resolutionDate;

      const date = new Date(timestampMs);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  loadResolutionDetails(): void {
    if (!this.data.id) {
      console.warn('No incident ID available to load resolution details.');
      return;
    }

    this.isResolutionLoading = true;
    this.resolutionService.getAll().subscribe({
      next: (resolutions: IncidentResolution[]) => {
        this.resolutionDetails = resolutions.find((res: IncidentResolution) => res.incidentId === this.data.id) || null;
        this.isResolutionLoading = false;
        console.log('Resolution details loaded:', this.resolutionDetails);
      },
      error: (error: any) => {
        console.error('Error loading resolution details:', error);
        this.isResolutionLoading = false;
        // Optionally, show an error message to the user
      }
    });
  }

  private convertClientToUserResponse(clients: ClientData[]): UserResponseDTO[] {
    return clients.map(client => ({
      id: client.id,
      organizationId: client.organization.organizationId,
      userCode: client.userCode,
      documentType: client.documentType as any, // Casting para compatibilidad de enum
      documentNumber: client.documentNumber,
      firstName: client.firstName,
      lastName: client.lastName,
      fullName: `${client.firstName} ${client.lastName}`,
      email: client.email,
      phone: client.phone,
      streetAddress: client.address,
      streetId: client.street?.streetId || '',
      zoneId: client.zone?.zoneId || '',
      status: client.status as any, // Casting para compatibilidad de enum
      registrationDate: client.createdAt,
      lastLogin: client.updatedAt, // Usando updatedAt como fallback
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      roles: client.roles as any[], // Casting para compatibilidad de enum
      username: client.userCode // Usando userCode como username
    }));
  }

  generateReport(): void {
    this.isGeneratingReport = true;

    try {
      // Convert the data to Incident format
      const incident: Incident = {
        id: this.data.id,
        organizationId: this.data.organizationId,
        incidentCode: this.data.incidentCode,
        incidentTypeId: this.data.incidentTypeId,
        incidentCategory: this.data.incidentCategory,
        zoneId: this.data.zoneId,
        incidentDate: this.data.incidentDate,
        title: this.data.title,
        description: this.data.description,
        severity: this.data.severity,
        status: this.data.status,
        affectedBoxesCount: this.data.affectedBoxesCount,
        reportedByUserId: this.data.reportedByUserId,
        assignedToUserId: this.data.assignedToUserId,
        resolvedByUserId: this.data.resolvedByUserId,
        resolved: this.data.resolved,
        resolutionNotes: this.data.resolutionNotes,
        recordStatus: this.data.recordStatus
      };

      // Generate the PDF report
      this.reportService.generateIncidentReport(
        incident,
        this.resolutionDetails || undefined,
        this.convertClientToUserResponse(this.clientUsers),
        this.products
      );

      this.isGeneratingReport = false;
    } catch (error) {
      console.error('Error generating report:', error);
      this.isGeneratingReport = false;
      // Optionally, show an error message to the user
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
