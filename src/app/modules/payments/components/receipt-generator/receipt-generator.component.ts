import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Payment } from '../../../../core/models/payment.model';
import { OrganizationService } from '../../../../core/services/organization.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { UserService } from '../../../../core/services/user.service';
import { BoxService } from '../../../../core/services/box.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-receipt-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt-generator.component.html',
  styleUrl: './receipt-generator.component.css'
})
export class ReceiptGeneratorComponent implements OnInit {
  payments: Payment[] = [];
  organizationsMap: Map<string, string> = new Map();
  usersMap: Map<string, string> = new Map();
  waterBoxesMap: Map<string, string> = new Map();
  generatedAt: Date = new Date();

  constructor(
    private location: Location,
    private organizationService: OrganizationService,
    private organizationContextService: OrganizationContextService,
    private userService: UserService,
    private boxService: BoxService
  ) {}

  ngOnInit(): void {
    // Recuperar datos desde el estado de navegación
    const state = (history && (history.state as any)) || {};
    this.payments = Array.isArray(state.payments) ? state.payments : [];

    // Cargar datos de referencia
    this.loadReferenceData();
  }

  private loadReferenceData(): void {
    // Get organization ID from OrganizationContextService
    const organizationId = this.organizationContextService.getCurrentOrganizationId();
    
    if (!organizationId) {
      console.error('No organization ID available for loading reference data');
      return;
    }
    
    console.log('Loading reference data for organization:', organizationId);
    
    forkJoin({
      organizations: this.organizationService.getAllOrganization(),
      users: this.userService.getAllUsers(), // Note: UserService might need similar updates  
      waterBoxes: this.boxService.getAllWaterBoxes()
    }).subscribe({
      next: (data) => {
        this.organizationsMap = new Map(
          data.organizations.map((org: any) => [org.organizationId, org.organizationName])
        );

        this.usersMap = new Map(
          data.users.map((user: any) => [user.id, user.fullName])
        );

        this.waterBoxesMap = new Map(
          data.waterBoxes.map((box: any) => [box.id.toString(), box.boxCode])
        );
      },
      error: () => {
        // Silenciar errores de mapeo
      }
    });
  }

  getOrganizationName(organizationId: string): string {
    return this.organizationsMap.get(organizationId) || organizationId || '--';
  }

  getUserName(userId: string): string {
    return this.usersMap.get(userId) || userId || '--';
  }

  getWaterBoxName(waterBoxId: string): string {
    return this.waterBoxesMap.get(waterBoxId) || waterBoxId || '--';
  }

  get totalAmount(): number {
    return this.payments.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  }

  goBack(): void {
    this.location.back();
  }

  async downloadPdf(): Promise<void> {
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // 📌 Encabezado
    pdf.setFontSize(16);
    pdf.text('Reporte de Pagos', 14, 15);

    pdf.setFontSize(10);
    pdf.text(`Generado: ${new Date(this.generatedAt).toLocaleString()}`, 14, 22);
    pdf.text(`Total registros: ${this.payments.length}`, 14, 28);
    pdf.text(`Monto Total: S/ ${this.totalAmount.toFixed(2)}`, 14, 34);

    // 📌 Definir tabla
    const head = [
      [
        'Organización',
        'Código',
        'Usuario',
        'Caja Agua',
        'Tipo',
        'Método',
        'Monto (S/)',
        'Fecha'
      ]
    ];

    const body = this.payments.map(p => [
      this.getOrganizationName(p.organizationId),
      p.paymentCode,
      this.getUserName(p.userId),
      this.getWaterBoxName(p.waterBoxId),
      p.paymentType,
      p.paymentMethod,
      (Number(p.totalAmount) || 0).toFixed(2),
      new Date(p.paymentDate).toLocaleDateString(),
      p.paymentStatus
    ]);

    // 📌 Insertar tabla en PDF
    autoTable(pdf, {
      head,
      body,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] }, // Azul estilo Tailwind
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // 📌 Guardar PDF
    pdf.save(`reporte-pagos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
