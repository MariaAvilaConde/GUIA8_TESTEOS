import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PaymentService } from '../../../../core/services/payment.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { Payment } from '../../../../core/models/payment.model';
import { OrganizationService } from '../../../../core/services/organization.service';
import { UserService } from '../../../../core/services/user.service';
import { BoxService } from '../../../../core/services/box.service';
import { organization } from '../../../../core/models/organization.model';
import { UserResponseDTO } from '../../../../core/models/user.model';
import { WaterBox } from '../../../../core/models/box.model';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './payment-list.component.html',
  styleUrl: './payment-list.component.css'
})
export class PaymentListComponent implements OnInit, OnDestroy {
  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  searchTerm: string = '';
  selectedStatus: string = 'todos';
  loading: boolean = false;

  // Maps para almacenar datos de organizaciones, usuarios y cajas de agua
  organizationsMap: Map<string, string> = new Map();
  usersMap: Map<string, string> = new Map();
  waterBoxesMap: Map<string, string> = new Map();

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 0;

  showAlert: boolean = false;
  alertMessage: string = '';
  alertType: 'success' | 'error' | 'info' = 'success';

  // Propiedad para el debounce del buscador
  private searchTimeout: any;

  constructor(
    private paymentService: PaymentService,
    private organizationService: OrganizationService,
    private userService: UserService,
    private boxService: BoxService,
    private organizationContextService: OrganizationContextService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPayments();
    this.loadReferenceData();
  }

  loadPayments(): void {
    this.loading = true;
    this.paymentService.getAllPayments().subscribe({
      next: (payments) => {
        this.payments = payments;
        this.filteredPayments = [...payments];
        this.calculateTotalPages();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.showAlertMessage('Error al cargar pagos', 'error');
        this.loading = false;
      }
    });
  }

  loadReferenceData(): void {
    // Get organization ID from OrganizationContextService
    const organizationId = this.organizationContextService.getCurrentOrganizationId();
    
    if (!organizationId) {
      console.error('No organization ID available for loading reference data');
      this.showAlertMessage('No se pudo obtener el ID de la organización', 'error');
      return;
    }
    
    console.log('Loading reference data for organization:', organizationId);
    
    // Cargar organizaciones, usuarios y cajas de agua en paralelo
    forkJoin({
      organizations: this.organizationService.getAllOrganization(),
      users: this.userService.getAllUsers(), // Note: UserService might need similar updates
      waterBoxes: this.boxService.getAllWaterBoxes()
    }).subscribe({
      next: (data) => {
        // Crear mapas para búsqueda rápida
        this.organizationsMap = new Map(
          data.organizations.map(org => [org.organizationId, org.organizationName])
        );

        this.usersMap = new Map(
          data.users.map(user => [user.id, user.fullName])
        );

        // Crear mapa de cajas de agua usando tanto ID como código
        this.waterBoxesMap = new Map();
        data.waterBoxes.forEach(box => {
          this.waterBoxesMap.set(box.id.toString(), box.boxCode);
          this.waterBoxesMap.set(box.boxCode, box.boxCode); // También mapear por código
        });
      },
      error: (error) => {
        console.error('Error loading reference data:', error);
        this.showAlertMessage('Error al cargar datos de referencia', 'error');
      }
    });
  }

  onSearch(): void {
    // Limpiar timeout anterior si existe
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Aplicar búsqueda después de 300ms de inactividad
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page when searching
      this.applyFilters();
    }, 300);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  onStatusChange(): void {
    this.currentPage = 1; // Reset to first page when changing status
    this.searchTerm = ''; // Clear search when changing status filter
    this.applyFilters();
  }

  private applyFilters(): void {
    const selected = this.selectedStatus.toLowerCase();
    const searchTermLower = this.searchTerm.toLowerCase().trim();

    this.filteredPayments = this.payments.filter(payment => {
      // Búsqueda en múltiples campos
      let matchesSearch = true;

      if (searchTermLower !== '') {
        const searchableFields = [
          // Código de pago
          payment.paymentCode || '',
          // Nombre de la organización
          this.getOrganizationName(payment.organizationId) || '',
          // Nombre del usuario
          this.getUserName(payment.userId) || '',
          // Código de la caja de agua
          this.getWaterBoxName(payment.waterBoxId) || '',
          // Tipo de pago
          payment.paymentType || '',
          // Método de pago
          payment.paymentMethod || '',
          // Monto total (convertir a string)
          payment.totalAmount?.toString() || '',
          // Fecha de pago (formatear)
          payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-ES') : '',
          // Estado del pago
          payment.paymentStatus || ''
        ];

        // Verificar si alguno de los campos contiene el término de búsqueda
        matchesSearch = searchableFields.some(field =>
          field.toLowerCase().includes(searchTermLower)
        );
      }

      // Filtro por estado
      let matchesStatus = true;
      if (selected !== 'todos') {
        const paymentStatus = payment.paymentStatus?.toLowerCase() || '';
        matchesStatus = paymentStatus === selected;
      }

      return matchesSearch && matchesStatus;
    });

    // Resetear a la primera página cuando se aplican filtros
    this.currentPage = 1;
    this.calculateTotalPages();
  }  // Pagination methods
  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  getCurrentPagePayments(): Payment[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPayments.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredPayments.length);
  }

  addNewPayment(): void {
    this.router.navigate(['/admin/payments/new']);
  }

  generatePdf(): void {
    const dataToExport = this.filteredPayments;
    this.router.navigate(['/admin/payments/receipt'], { state: { payments: dataToExport } });
  }

  editPayment(paymentId: string): void {
    this.router.navigate(['/admin/payments/edit', paymentId]);
  }

  detailPayment(paymentId: string): void {
    this.router.navigate(['admin/payments/detail', paymentId]);
  }

  private showAlertMessage(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;

    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  getFullUser(payment: Payment): string {
    return `${payment.userId}`;
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'PAGADO':
        return 'Pagado';
      case 'PENDIENTE':
        return 'Pendiente';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  }

  getPaymentStatusClass(status: string): string {
    switch (status) {
      case 'PAGADO':
        return 'bg-green-100 text-green-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELADO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  trackByPaymentsId(index: number, payment: Payment): string {
    return payment.paymentId;
  }

  getCompletoPaymentsCount(): number {
    return this.payments.filter(payment => payment.paymentStatus === 'PAGADO').length;
  }

  getPendientePaymentsCount(): number {
    return this.payments.filter(payment => payment.paymentStatus === 'PENDIENTE').length;
  }

  getCanceladoPaymentsCount(): number {
    return this.payments.filter(payment => payment.paymentStatus === 'CANCELADO').length;
  }

  // Métodos para obtener nombres reales en lugar de IDs
  getOrganizationName(organizationId: string): string {
    return this.organizationsMap.get(organizationId) || '--';
  }

  getUserName(userId: string): string {
    return this.usersMap.get(userId) || '--';
  }

  getWaterBoxName(waterBoxId: string): string {
    if (!waterBoxId) {
      return '--';
    }
    
    // Si waterBoxId es directamente el código de la caja (contiene caracteres no numéricos), devolverlo
    if (waterBoxId && /[A-Za-z]/.test(waterBoxId)) {
      return waterBoxId;
    }
    
    // Si es un ID numérico, buscar en el mapa
    return this.waterBoxesMap.get(waterBoxId) || waterBoxId;
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}
