import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AdminUsersService } from '../../services/admin-users.service';
import { UserWithLocationResponse } from '../../models/admin-client.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ModalService } from '../../../../core/services/modal.service';
import { StatusUsers } from '../../../../core/models/user.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrl: './client-list.component.css'
})
export class ClientListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  clients: UserWithLocationResponse[] = [];
  filteredClients: UserWithLocationResponse[] = [];
  isLoading = false;
  error: string | null = null;
  searchTerm = '';
  filterStatus: string | 'ALL' = 'ALL';
  filterDocumentType: string | 'ALL' = 'ALL';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  sortBy: string = 'userCode';
  sortOrder: 'asc' | 'desc' = 'asc';

  selectedClients: Set<string> = new Set();
  showFilters = false;

  Math = Math;

  constructor(
    private adminUsersService: AdminUsersService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private modalService: ModalService,
    private router: Router
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngOnInit(): void {
    this.loadClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar lista de clientes
   */
  loadClients(): void {
    this.isLoading = true;

    // Obtener organizationId del usuario actual
    const currentOrganizationId = this.authService.getCurrentOrganizationId();

    if (!currentOrganizationId) {
      console.error('No se encontró organizationId del usuario actual');
      this.error = 'Error: No se pudo obtener la organización del usuario';
      this.isLoading = false;
      this.notificationService.error(
        'Error de sesión',
        'No se pudo obtener la organización del usuario actual'
      );
      return;
    }

    console.log('Cargando clientes para organización:', currentOrganizationId);

    this.adminUsersService.getClients(currentOrganizationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Clients response:', response); // Debug log
          if (response.success && response.data) {
            // Los datos vienen como array directo desde /clients/all
            this.clients = Array.isArray(response.data) ? response.data : [];
            this.totalItems = this.clients.length;
          } else {
            this.clients = [];
            this.totalItems = 0;
          }

          this.applyFilters();
          this.isLoading = false;
          this.error = null;
        },
        error: (error: any) => {
          console.error('Error loading clients:', error);
          this.error = 'Error al cargar los clientes';
          this.isLoading = false;
          this.clients = [];
          this.filteredClients = [];
          this.notificationService.error(
            'Error',
            'No se pudieron cargar los clientes'
          );
        }
      });
  }  /**
   * Buscar clientes
   */
  onSearch(term: string): void {
    this.searchTerm = term;
    this.searchSubject.next(term);
  }

  /**
   * Realizar búsqueda
   */
  private performSearch(searchTerm: string): void {
    this.currentPage = 1;
    this.loadClients();
  }
  /**
   * Aplicar filtros y ordenamiento local
   */
  applyFilters(): void {
    // Verificar que clients sea un array válido
    if (!this.clients || !Array.isArray(this.clients)) {
      this.filteredClients = [];
      this.totalItems = 0;
      return;
    }

    this.filteredClients = [...this.clients];

    // Aplicar filtro de búsqueda
    if (this.searchTerm) {
      this.filteredClients = this.filteredClients.filter(client =>
        (client.firstName + ' ' + client.lastName).toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.userCode.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        client.documentNumber.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de estado
    if (this.filterStatus !== 'ALL') {
      this.filteredClients = this.filteredClients.filter(client =>
        client.status === this.filterStatus
      );
    }

    // Aplicar filtro de tipo de documento
    if (this.filterDocumentType !== 'ALL') {
      this.filteredClients = this.filteredClients.filter(client =>
        client.documentType === this.filterDocumentType
      );
    }

    this.applySorting();
    this.totalItems = this.filteredClients.length;
    this.updatePagination();
  }

  /**
   * Aplicar ordenamiento local
   */
  private applySorting(): void {
    if (this.sortBy === 'userCode') {
      this.filteredClients.sort((a, b) => {
        const codeA = a.userCode || '';
        const codeB = b.userCode || '';

        if (this.sortOrder === 'asc') {
          return codeA.localeCompare(codeB);
        } else {
          return codeB.localeCompare(codeA);
        }
      });
    } else if (this.sortBy === 'createdAt') {
      this.filteredClients.sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();

        if (this.sortOrder === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    } else {
      this.filteredClients.sort((a, b) => {
        let valueA: any = (a as any)[this.sortBy];
        let valueB: any = (b as any)[this.sortBy];

        valueA = valueA?.toString().toLowerCase() || '';
        valueB = valueB?.toString().toLowerCase() || '';

        if (this.sortOrder === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      });
    }
  }

  /**
   * Cambiar filtro de estado
   */
  onStatusFilterChange(status: string | 'ALL'): void {
    this.filterStatus = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Cambiar filtro de tipo de documento
   */
  onDocumentTypeFilterChange(documentType: string | 'ALL'): void {
    this.filterDocumentType = documentType;
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Actualizar paginación
   */
  private updatePagination(): void {
    // Lógica adicional de paginación si es necesaria
  }

  /**
   * Obtener clientes paginados
   */
  get paginatedClients(): UserWithLocationResponse[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredClients.slice(startIndex, endIndex);
  }

  /**
   * Obtener número total de páginas
   */
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * Cambiar página
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Ir a la página anterior
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadClients();
    }
  }

  /**
   * Ir a la página siguiente
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadClients();
    }
  }

  /**
   * Alternar selección de cliente
   */
  toggleClientSelection(clientId: string): void {
    if (this.selectedClients.has(clientId)) {
      this.selectedClients.delete(clientId);
    } else {
      this.selectedClients.add(clientId);
    }
  }

  /**
   * Seleccionar todos los clientes
   */
  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedClients.clear();
    } else {
      this.paginatedClients.forEach(client => {
        this.selectedClients.add(client.id);
      });
    }
  }

  /**
   * Verificar si todos están seleccionados
   */
  get isAllSelected(): boolean {
    return this.paginatedClients.length > 0 &&
      this.paginatedClients.every(client => this.selectedClients.has(client.id));
  }

  /**
   * Verificar si hay selección parcial
   */
  get isPartiallySelected(): boolean {
    const selectedInPage = this.paginatedClients.filter(client => this.selectedClients.has(client.id)).length;
    return selectedInPage > 0 && selectedInPage < this.paginatedClients.length;
  }

  /**
   * Eliminar cliente
   */
  deleteClient(client: UserWithLocationResponse): void {
    const clientName = `${client.firstName} ${client.lastName}`;
    this.modalService.confirm(
      'Confirmar Eliminación',
      `¿Está seguro de que desea eliminar al cliente "${clientName}"? Esta acción no se puede deshacer.`,
      'Eliminar',
      'Cancelar'
    ).pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.adminUsersService.deleteClient(client.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.notificationService.success(
              'Cliente eliminado',
              `El cliente ${clientName} ha sido eliminado exitosamente`
            );
            this.loadClients();
          },
          error: (error: any) => {
            console.error('Error deleting client:', error);
            this.notificationService.error(
              'Error al eliminar',
              'No se pudo eliminar el cliente. Inténtelo nuevamente.'
            );
          }
        });
      }
    });
  }

  /**
   * Restaurar cliente eliminado
   */
  restoreClient(client: UserWithLocationResponse): void {
    const clientName = `${client.firstName} ${client.lastName}`;
    this.modalService.confirm(
      'Confirmar Restauración',
      `¿Está seguro de que desea restaurar al cliente "${clientName}"?`,
      'Restaurar',
      'Cancelar'
    ).pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        this.adminUsersService.restoreClient(client.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.notificationService.success(
              'Cliente restaurado',
              `El cliente ${clientName} ha sido restaurado exitosamente`
            );
            this.loadClients();
          },
          error: (error: any) => {
            console.error('Error restoring client:', error);
            this.notificationService.error(
              'Error al restaurar',
              'No se pudo restaurar el cliente. Inténtelo nuevamente.'
            );
          }
        });
      }
    });
  }

  /**
   * Eliminar clientes seleccionados
   */
  deleteSelectedClients(): void {
    if (this.selectedClients.size === 0) return;

    const selectedCount = this.selectedClients.size;
    this.modalService.confirm(
      'Confirmar Eliminación Múltiple',
      `¿Está seguro de que desea eliminar ${selectedCount} cliente${selectedCount > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      'Eliminar Todos',
      'Cancelar'
    ).pipe(takeUntil(this.destroy$)).subscribe(confirmed => {
      if (confirmed) {
        const clientIds = Array.from(this.selectedClients);
        let completedRequests = 0;
        let errors = 0;

        clientIds.forEach(clientId => {
          this.adminUsersService.deleteClient(clientId).pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: () => {
              completedRequests++;
              if (completedRequests === clientIds.length) {
                this.selectedClients.clear();
                if (errors === 0) {
                  this.notificationService.success(
                    'Clientes eliminados',
                    `Se eliminaron ${selectedCount} cliente${selectedCount > 1 ? 's' : ''} exitosamente`
                  );
                } else {
                  this.notificationService.warning(
                    'Eliminación parcial',
                    `Se eliminaron ${completedRequests - errors} de ${selectedCount} clientes. ${errors} fallaron.`
                  );
                }
                this.loadClients();
              }
            },
            error: (error: any) => {
              console.error('Error deleting client:', error);
              errors++;
              completedRequests++;
              if (completedRequests === clientIds.length) {
                this.selectedClients.clear();
                this.notificationService.error(
                  'Error en eliminación',
                  `No se pudieron eliminar ${errors} de ${selectedCount} clientes.`
                );
                this.loadClients();
              }
            }
          });
        });
      }
    });
  }

  /**
   * Obtener clase CSS para estado
   */
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'INACTIVE': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'SUSPENDED': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'PENDING': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    };
    return statusClasses[status] || '';
  }

  /**
   * Obtener texto para estado
   */
  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'SUSPENDED': 'Suspendido',
      'PENDING': 'Pendiente'
    };
    return statusTexts[status] || status;
  }

  /**
   * Obtener texto para tipo de documento
   */
  getDocumentTypeText(documentType: string): string {
    const documentTypeTexts: { [key: string]: string } = {
      'DNI': 'DNI',
      'CARNET_EXTRANJERIA': 'C.E.'
    };
    return documentTypeTexts[documentType] || documentType;
  }

  /**
   * Refrescar lista
   */
  refreshList(): void {
    this.selectedClients.clear();
    this.loadClients();
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE');
  }

  /**
   * Track by function para ngFor
   */
  trackByClientId(index: number, client: UserWithLocationResponse): string {
    return client.id;
  }

  /**
   * Navegación - Crear cliente
   */
  createClient(): void {
    console.log('🆕 ClientListComponent: createClient() called');
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Active role:', this.authService.getActiveRole());
    console.log('Organization ID:', this.authService.getCurrentOrganizationId());
    console.log('Is authenticated:', this.authService.isAuthenticated());

    try {
      this.router.navigate(['/admin/users/create']);
      console.log('✅ Navigation to /admin/users/create initiated');
    } catch (error) {
      console.error('❌ Error navigating to create client:', error);
    }
  }

  /**
   * Navegación - Ver detalles del cliente
   */
  viewClient(client: UserWithLocationResponse): void {
    console.log('👁️ ClientListComponent: viewClient() called for client:', client.id);
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Active role:', this.authService.getActiveRole());
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('Organization ID:', this.authService.getCurrentOrganizationId());
    console.log('Token exists:', !!this.authService.getCurrentUser());

    try {
      console.log('Attempting navigation to:', `/admin/users/detail/${client.id}`);
      this.router.navigate(['/admin/users/detail', client.id]);
      console.log('✅ Navigation to view client initiated');
    } catch (error) {
      console.error('❌ Error navigating to view client:', error);
    }
  }

  /**
   * Navegación - Editar cliente
   */
  editClient(client: UserWithLocationResponse): void {
    console.log('✏️ ClientListComponent: editClient() called for client:', client.id);
    console.log('Current user:', this.authService.getCurrentUser());
    console.log('Active role:', this.authService.getActiveRole());
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('Organization ID:', this.authService.getCurrentOrganizationId());
    console.log('Token exists:', !!this.authService.getCurrentUser());

    try {
      console.log('Attempting navigation to:', `/admin/users/edit/${client.id}`);
      this.router.navigate(['/admin/users/edit', client.id]);
      console.log('✅ Navigation to edit client initiated');
    } catch (error) {
      console.error('❌ Error navigating to edit client:', error);
    }
  }

  /**
   * Obtener números de página para paginación
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
  /**
   * Cambiar ordenamiento
   */
  sort(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.currentPage = 1;

    if (this.clients.length > 0) {
      this.applyFilters();
    } else {
      this.loadClients();
    }
  }

  /**
   * Obtener icono de sorting
   */
  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'sort';
    }
    return this.sortOrder === 'asc' ? 'sort-up' : 'sort-down';
  }

  /**
   * Limpiar selección
   */
  clearSelection(): void {
    this.selectedClients.clear();
  }

  /**
   * Eliminar clientes seleccionados en lote
   */
  bulkDelete(): void {
    this.deleteSelectedClients();
  }
}
