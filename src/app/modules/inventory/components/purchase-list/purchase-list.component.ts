import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { InventoryService } from '../../../../core/services/inventory.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { UserService } from '../../services/user.service';
import {
  PurchaseResponse,
  PurchaseStatus,
  SupplierResponse,
  ProductResponse
} from '../../../../core/models/inventory.model';

// Tipo para el formulario interno (antes de enviar al backend)
interface PurchaseDetailForm {
  productId: string;
  quantity: number;
  unitPrice: number;
  observations?: string;
}

@Component({
  selector: 'app-purchase-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './purchase-list.component.html',
  styleUrls: ['./purchase-list.component.css']
})
export class PurchaseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  purchases: PurchaseResponse[] = [];
  filteredPurchases: PurchaseResponse[] = [];
  paginatedPurchases: PurchaseResponse[] = [];
  suppliers: SupplierResponse[] = [];
  products: ProductResponse[] = [];
  users: Map<string, any> = new Map(); // Mapeo de userId -> usuario
  loading = true;
  error: string | null = null;

  // Filtros
  searchTerm = '';
  selectedStatus: PurchaseStatus | 'ALL' = 'ALL';
  selectedSupplier: string | 'ALL' = 'ALL';

  // Paginación
  currentPage = 1;
  itemsPerPage = 6;

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showDetailModal = false;
  selectedPurchase: PurchaseResponse | null = null;

  // Enums para el template
  PurchaseStatus = PurchaseStatus;

  organizationId: string | null = null;

  constructor(
    private inventoryService: InventoryService,
    private organizationContextService: OrganizationContextService,
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.organizationId = this.organizationContextService.getCurrentOrganizationId();
    if (!this.organizationId) {
      this.error = 'No se encontró información de la organización';
      this.loading = false;
      return;
    }

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    // Cargar compras, proveedores y productos en paralelo
    Promise.all([
      this.inventoryService.getPurchasesByOrganization(this.organizationId!).toPromise(),
      this.inventoryService.getSuppliers(this.organizationId!).toPromise(),
      this.inventoryService.getProducts(this.organizationId!).toPromise()
    ]).then(([purchases, suppliers, products]) => {
      // Filtrar elementos eliminados/inactivos
      this.purchases = (purchases || []);
      this.suppliers = (suppliers || []).filter(s => s.status === 'ACTIVO');
      this.products = (products || []).filter(p => p.status === 'ACTIVO');

      // Obtener IDs únicos de usuarios de las compras
      const userIds = new Set<string>();
      this.purchases.forEach(purchase => {
        if (purchase.requestedByUserId) {
          userIds.add(purchase.requestedByUserId);
        }
        if (purchase.approvedByUserId) {
          userIds.add(purchase.approvedByUserId);
        }
      });

      // Cargar información de usuarios
      this.loadUsers(Array.from(userIds)).then(() => {
        this.applyFilters();
        this.loading = false;
      });
    }).catch(error => {
      console.error('Error loading data:', error);
      this.error = 'Error al cargar los datos';
      this.loading = false;
    });
  }

  /**
   * Cargar información de usuarios por sus IDs
   */
  private async loadUsers(userIds: string[]): Promise<void> {
    const userPromises = userIds.map(userId =>
      this.userService.getUserById(userId).toPromise()
        .then((user: any) => {
          if (user) {
            this.users.set(userId, user);
          }
        })
        .catch((error: any) => {
          console.error(`Error loading user ${userId}:`, error);
          // No fallar por un usuario, continuar con los demás
        })
    );

    await Promise.all(userPromises);
  }

  applyFilters(): void {
    let filtered = [...this.purchases];

    // Filter by search term
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(purchase =>
        purchase.purchaseCode.toLowerCase().includes(search) ||
        purchase.supplierName.toLowerCase().includes(search) ||
        (purchase.invoiceNumber && purchase.invoiceNumber.toLowerCase().includes(search))
      );
    }

    // Filter by status
    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(purchase => purchase.status === this.selectedStatus);
    }

    // Filter by supplier
    if (this.selectedSupplier !== 'ALL') {
      filtered = filtered.filter(purchase => purchase.supplierId === this.selectedSupplier);
    }

    // Ordenar por código de compra (PUR001, PUR002, etc.)
    filtered.sort((a, b) => {
      // Extraer el número del código (ejemplo: PUR001 -> 001)
      const getNumber = (code: string) => {
        const match = code.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      };

      return getNumber(a.purchaseCode) - getNumber(b.purchaseCode);
    });

    this.filteredPurchases = filtered;
    this.currentPage = 1; // Reset page when filtering
    this.updatePaginatedPurchases();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onSupplierChange(): void {
    this.applyFilters();
  }

  // Métodos de paginación
  updatePaginatedPurchases(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPurchases = this.filteredPurchases.slice(startIndex, endIndex);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePaginatedPurchases();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedPurchases();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.updatePaginatedPurchases();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredPurchases.length / this.itemsPerPage);
  }

  getStartItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndItem(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.filteredPurchases.length ? this.filteredPurchases.length : end;
  }

  // CRUD Operations - Navegación a páginas
  openCreateModal(): void {
    this.router.navigate(['/admin/inventory/purchases/new']);
  }

  openDetailModal(purchase: PurchaseResponse): void {
    this.router.navigate(['/admin/inventory/purchases/detail', purchase.purchaseId]);
  }

  openEditModal(purchase: PurchaseResponse): void {
    this.router.navigate(['/admin/inventory/purchases/edit', purchase.purchaseId]);
  }

  openDeleteModal(purchase: PurchaseResponse): void {
    // Verificar si la compra puede ser eliminada
    if (!this.canDeletePurchaseWithMessage(purchase)) {
      return;
    }

    // Mostrar confirmación con SweetAlert2
    Swal.fire({
      title: '¿Eliminar compra?',
      text: `¿Estás seguro de que deseas eliminar la compra ${purchase.purchaseCode}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletePurchase(purchase);
      }
    });
  }

  /**
   * Verificar si una compra puede ser eliminada (solo verificación, sin mostrar mensaje)
   */
  canDeletePurchase(purchase: PurchaseResponse): boolean {
    // Estados que NO permiten eliminación
    const nonDeletableStatuses = [
      PurchaseStatus.APROBADO,
      PurchaseStatus.EN_TRANSITO,
      PurchaseStatus.RECIBIDO,
      PurchaseStatus.COMPLETADO,
      PurchaseStatus.PARCIAL
    ];

    return !nonDeletableStatuses.includes(purchase.status);
  }

  /**
   * Verificar si una compra puede ser eliminada y mostrar mensaje si no es posible
   */
  canDeletePurchaseWithMessage(purchase: PurchaseResponse): boolean {
    if (!this.canDeletePurchase(purchase)) {
      Swal.fire({
        icon: 'warning',
        title: 'No se puede eliminar',
        text: `No se puede eliminar una compra en estado "${this.getStatusText(purchase.status)}". Solo se pueden eliminar compras en estado Pendiente, Rechazado o Cancelado.`,
        confirmButtonText: 'Entendido'
      });
      return false;
    }

    return true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDetailModal = false;
    this.selectedPurchase = null;
  }

  deletePurchase(purchase: PurchaseResponse): void {
    // Verificación adicional antes de eliminar
    if (!this.canDeletePurchase(purchase)) {
      Swal.fire({
        icon: 'error',
        title: 'Operación no permitida',
        text: `No se puede eliminar una compra en estado "${this.getStatusText(purchase.status)}"`,
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.inventoryService.deletePurchase(purchase.purchaseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: `La compra ${purchase.purchaseCode} ha sido eliminada correctamente`,
            confirmButtonText: 'Continuar'
          });
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting purchase:', error);

          let errorMessage = 'Ha ocurrido un error al eliminar la compra. Por favor, inténtalo nuevamente.';

          // Manejar errores específicos del backend
          if (error.status === 400) {
            errorMessage = 'No se puede eliminar esta compra. Verifique su estado.';
          } else if (error.status === 403) {
            errorMessage = 'No tienes permisos para eliminar esta compra.';
          } else if (error.status === 404) {
            errorMessage = 'La compra no existe o ya ha sido eliminada.';
          } else if (error.status === 409) {
            errorMessage = 'No se puede eliminar la compra porque tiene dependencias.';
          }

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMessage,
            confirmButtonText: 'Entendido'
          });
        }
      });
  }

  onDeletePurchase(): void {
    // Este método ya no se usa, lo mantenemos por compatibilidad
    if (!this.selectedPurchase) return;
    this.deletePurchase(this.selectedPurchase);
  }

  updatePurchaseStatus(purchase: PurchaseResponse, newStatus: PurchaseStatus): void {
    this.inventoryService.updatePurchaseStatus(purchase.purchaseId, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Estado actualizado!',
            text: `El estado de la compra ${purchase.purchaseCode} ha sido actualizado a "${this.getStatusText(newStatus)}"`,
            confirmButtonText: 'Continuar',
            timer: 2000,
            timerProgressBar: true
          });
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating purchase status:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al actualizar el estado de la compra',
            confirmButtonText: 'Entendido'
          });
        }
      });
  }

  openStatusChangeModal(purchase: PurchaseResponse): void {
    const statusOptions: { [key: string]: string } = {
      [PurchaseStatus.PENDIENTE]: 'Pendiente',
      [PurchaseStatus.APROBADO]: 'Aprobado',
      [PurchaseStatus.RECHAZADO]: 'Rechazado',
      [PurchaseStatus.EN_TRANSITO]: 'En Tránsito',
      [PurchaseStatus.RECIBIDO]: 'Recibido',
      [PurchaseStatus.CANCELADO]: 'Cancelado',
      [PurchaseStatus.COMPLETADO]: 'Completado',
      [PurchaseStatus.PARCIAL]: 'Parcial'
    };

    // Crear opciones HTML para el select
    const optionsHtml = Object.entries(statusOptions)
      .map(([value, text]) =>
        `<option value="${value}" ${value === purchase.status ? 'selected' : ''}>${text}</option>`
      ).join('');

    Swal.fire({
      title: `Cambiar estado de ${purchase.purchaseCode}`,
      html: `
        <div class="text-left">
          <p class="mb-4 text-gray-600">Estado actual: <strong>${this.getStatusText(purchase.status)}</strong></p>
          <label for="status-select" class="block text-sm font-medium text-gray-700 mb-2">
            Nuevo estado:
          </label>
          <select id="status-select" class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
            ${optionsHtml}
          </select>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Actualizar Estado',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const selectElement = document.getElementById('status-select') as HTMLSelectElement;
        const newStatus = selectElement.value as PurchaseStatus;

        if (newStatus === purchase.status) {
          Swal.showValidationMessage('Debes seleccionar un estado diferente al actual');
          return false;
        }

        return newStatus;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.updatePurchaseStatus(purchase, result.value);
      }
    });
  }  /**
   * Obtener el nombre completo del usuario por su ID
   */
  getUserFullName(userId: string): string {
    const user = this.users.get(userId);
    if (user) {
      // Usar la estructura correcta del UserData del nuevo servicio
      return `${user.firstName} ${user.lastName}`.trim();
    }
    return 'Usuario no encontrado';
  }

  // Métodos auxiliares para los templates
  getCurrentUserId(): string {
    return this.organizationContextService.getCurrentUserCode() || '';
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.productId === productId);
    return product ? product.productName : 'Producto no encontrado';
  }

  getStatusBadgeClass(status: PurchaseStatus): string {
    switch (status) {
      case PurchaseStatus.PENDIENTE:
        return 'bg-yellow-100 text-yellow-800';
      case PurchaseStatus.APROBADO:
        return 'bg-green-100 text-green-800';
      case PurchaseStatus.RECHAZADO:
        return 'bg-red-100 text-red-800';
      case PurchaseStatus.EN_TRANSITO:
        return 'bg-blue-100 text-blue-800';
      case PurchaseStatus.RECIBIDO:
        return 'bg-purple-100 text-purple-800';
      case PurchaseStatus.CANCELADO:
        return 'bg-gray-100 text-gray-800';
      case PurchaseStatus.COMPLETADO:
        return 'bg-emerald-100 text-emerald-800';
      case PurchaseStatus.PARCIAL:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: PurchaseStatus): string {
    switch (status) {
      case PurchaseStatus.PENDIENTE:
        return 'Pendiente';
      case PurchaseStatus.APROBADO:
        return 'Aprobado';
      case PurchaseStatus.RECHAZADO:
        return 'Rechazado';
      case PurchaseStatus.EN_TRANSITO:
        return 'En Tránsito';
      case PurchaseStatus.RECIBIDO:
        return 'Recibido';
      case PurchaseStatus.CANCELADO:
        return 'Cancelado';
      case PurchaseStatus.COMPLETADO:
        return 'Completado';
      case PurchaseStatus.PARCIAL:
        return 'Parcial';
      default:
        return status;
    }
  }

  refresh(): void {
    this.loadData();
  }
}
