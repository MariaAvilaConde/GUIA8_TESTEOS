import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, startWith, combineLatest } from 'rxjs';
import { InventoryMovementService, InventoryMovementDTO, InventoryMovementFilterDTO, ConsumptionMovementDTO } from '../../services/inventory-movement.service';
import { ProductService, Product } from '../../services/product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService, UserData } from '../../services/user.service';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

@Component({
     selector: 'app-inventory-movements',
     standalone: true,
     imports: [CommonModule, ReactiveFormsModule],
     templateUrl: './inventory-movements.component.html',
     styleUrls: ['./inventory-movements.component.css']
})
export class InventoryMovementsComponent implements OnInit, OnDestroy {

     private destroy$ = new Subject<void>();

     // Data
     movements: InventoryMovementDTO[] = [];
     products: Product[] = [];
     filteredMovements: InventoryMovementDTO[] = [];

     // Loading states
     loading = false;
     loadingProducts = false;

     // Pagination
     currentPage = 0;
     pageSize = 20;
     totalMovements = 0;

     // Filter form
     filterForm!: FormGroup;

     // Consumption form
     consumptionForm!: FormGroup;
     showConsumptionModal = false;
     submittingConsumption = false;

     // UI states
     showFilters = false;
     selectedMovement: InventoryMovementDTO | null = null;
     selectedClient: UserData | null = null;
     loadingClient = false;

     // Make Math available in template
     Math = Math;     // Constants
     movementTypes = [
          { value: 'ENTRADA', label: 'Entrada', class: 'text-green-600 bg-green-100' },
          { value: 'SALIDA', label: 'Salida', class: 'text-red-600 bg-red-100' },
          { value: 'AJUSTE', label: 'Ajuste', class: 'text-blue-600 bg-blue-100' }
     ];

     movementReasons = [
          { value: 'COMPRA', label: 'Compra' },
          { value: 'VENTA', label: 'Venta' },
          { value: 'DEVOLUCION', label: 'Devolución' },
          { value: 'AJUSTE_INVENTARIO', label: 'Ajuste de Inventario' },
          { value: 'TRANSFERENCIA', label: 'Transferencia' },
          { value: 'MERMA', label: 'Merma' },
          { value: 'USO_INTERNO', label: 'Uso Interno' },
          { value: 'OTRO', label: 'Otro' }
     ];

     constructor(
          private inventoryMovementService: InventoryMovementService,
          private productService: ProductService,
          private authService: AuthService,
          private userService: UserService,
          private fb: FormBuilder,
          private router: Router
     ) {
          this.initializeFilterForm();
          this.initializeConsumptionForm();
     }

     ngOnInit(): void {
          this.loadData();
          this.setupFilterSubscription();
     }

     ngOnDestroy(): void {
          this.destroy$.next();
          this.destroy$.complete();
     }

     private initializeFilterForm(): void {
          // NO inicializar con filtros de fecha para mostrar todos los movimientos
          this.filterForm = this.fb.group({
               productId: [''],
               movementType: [''],
               movementReason: [''],
               startDate: [''], // Vacío por defecto - sin filtro
               endDate: [''],   // Vacío por defecto - sin filtro
               sortBy: ['movementDate'],
               sortDirection: ['DESC']
          });
     }

     private initializeConsumptionForm(): void {
          this.consumptionForm = this.fb.group({
               productId: ['', [Validators.required]],
               quantity: ['', [Validators.required, Validators.min(1)]],
               unitCost: ['', [Validators.required, Validators.min(0.01)]],
               movementReason: ['USO_INTERNO', [Validators.required]],
               referenceDocument: [''],
               referenceId: [''],
               previousStock: ['', [Validators.required, Validators.min(0)]],
               newStock: ['', [Validators.required, Validators.min(0)]]
          });

          // Auto-calcular newStock cuando cambien quantity o previousStock
          this.consumptionForm.get('quantity')?.valueChanges.subscribe(() => this.calculateNewStock());
          this.consumptionForm.get('previousStock')?.valueChanges.subscribe(() => this.calculateNewStock());
     }

     private loadData(): void {
          const organizationId = this.authService.getCurrentUser()?.organizationId;
          if (!organizationId) return;

          this.loading = true;
          this.loadingProducts = true;

          // Cargar productos para el filtro
          this.productService.getProductsByOrganization(organizationId)
               .pipe(takeUntil(this.destroy$))
               .subscribe({
                    next: (products) => {
                         this.products = products || [];
                         this.loadingProducts = false;
                    },
                    error: (error) => {
                         console.error('Error loading products:', error);
                         this.products = [];
                         this.loadingProducts = false;
                    }
               });

          // Cargar movimientos iniciales
          this.loadMovements();
     }

     private setupFilterSubscription(): void {
          this.filterForm.valueChanges
               .pipe(
                    debounceTime(500),
                    distinctUntilChanged(),
                    takeUntil(this.destroy$)
               )
               .subscribe(() => {
                    this.currentPage = 0;
                    this.loadMovements();
               });
     }

     private loadMovements(): void {
          const organizationId = this.authService.getCurrentUser()?.organizationId;
          console.log('🔍 Loading movements for organizationId:', organizationId);

          if (!organizationId) {
               console.warn('⚠️ No organizationId found, cannot load movements');
               return;
          }

          this.loading = true;

          const filters: InventoryMovementFilterDTO = {
               organizationId,
               ...this.filterForm.value,
               page: this.currentPage,
               size: this.pageSize
          };

          // Limpiar campos vacíos
          Object.keys(filters).forEach(key => {
               if (filters[key as keyof InventoryMovementFilterDTO] === '' ||
                    filters[key as keyof InventoryMovementFilterDTO] === null) {
                    delete filters[key as keyof InventoryMovementFilterDTO];
               }
          });

          console.log('🔍 Filters being applied:', filters);

          this.inventoryMovementService.getMovementsWithFilters(filters)
               .pipe(takeUntil(this.destroy$))
               .subscribe({
                    next: (movements) => {
                         console.log('✅ Movements received:', movements);
                         console.log('📊 Number of movements:', movements?.length || 0);
                         console.log('🔍 Type of movements:', typeof movements);
                         console.log('🔍 Is array?:', Array.isArray(movements));

                         // Asegurar que siempre sea un array
                         this.movements = Array.isArray(movements) ? movements : [];
                         this.filteredMovements = this.movements;
                         this.loading = false;
                    },
                    error: (error) => {
                         console.error('❌ Error loading movements:', error);
                         console.error('📍 Error details:', {
                              message: error.message,
                              status: error.status,
                              url: error.url,
                              error: error.error
                         });
                         this.loading = false;
                    }
               });

          // Cargar contador
          this.inventoryMovementService.countMovementsByOrganization(organizationId)
               .pipe(takeUntil(this.destroy$))
               .subscribe({
                    next: (count) => {
                         console.log('📊 Movement count received:', count);
                         this.totalMovements = count;
                    },
                    error: (error) => {
                         console.error('❌ Error loading movements count:', error);
                         console.error('📍 Count error details:', {
                              message: error.message,
                              status: error.status,
                              url: error.url,
                              error: error.error
                         });
                    }
               });
     }

     /**
      * Cargar productos desde el servicio (para actualizar stock tras movimientos)
      */
     private loadProducts(): void {
          const organizationId = this.authService.getCurrentUser()?.organizationId;
          if (!organizationId) {
               console.warn('⚠️ No organizationId found, cannot load products');
               return;
          }

          console.log('🔄 Reloading products to update stock...');
          this.loadingProducts = true;

          this.productService.getProductsByOrganization(organizationId)
               .pipe(takeUntil(this.destroy$))
               .subscribe({
                    next: (products) => {
                         console.log('✅ Products reloaded:', products?.length || 0, 'products');
                         this.products = products || [];
                         this.loadingProducts = false;
                    },
                    error: (error) => {
                         console.error('❌ Error reloading products:', error);
                         this.loadingProducts = false;
                    }
               });
     }

     // UI Methods
     toggleFilters(): void {
          this.showFilters = !this.showFilters;
     }

     clearFilters(): void {
          this.filterForm.reset({
               productId: '',
               movementType: '',
               movementReason: '',
               startDate: '', // Sin filtro por fecha
               endDate: '',   // Sin filtro por fecha
               sortBy: 'movementDate',
               sortDirection: 'DESC'
          });
     }

     exportToExcel(): void {
          if (!this.movements || this.movements.length === 0) {
               Swal.fire({
                    icon: 'info',
                    title: 'Sin datos para exportar',
                    text: 'No hay movimientos de inventario para exportar. Agrega algunos movimientos primero.',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#3b82f6'
               });
               return;
          }

          // Preparar los datos para exportación
          const exportData = this.movements.map(movement => ({
               'Fecha': this.formatDateTime(movement.movementDate),
               'Tipo': this.getMovementTypeConfig(movement.movementType).label,
               'Producto': movement.productName || this.getProductName(movement.productId),
               'Código': movement.productCode,
               'Motivo': this.getMovementReasonLabel(movement.movementReason),
               'Cantidad': movement.quantity,
               'Costo Unitario': movement.unitCost,
               'Valor Total': movement.totalValue,
               'Stock Anterior': movement.previousStock,
               'Stock Nuevo': movement.newStock,
               'Documento Referencia': movement.referenceDocument || '',
               'Observaciones': movement.observations || '',
               'Usuario': movement.userName || movement.userId
          }));

          // Crear el libro de trabajo
          const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

          // Ajustar ancho de columnas
          const colWidths = [
               { wch: 20 }, // Fecha
               { wch: 12 }, // Tipo
               { wch: 30 }, // Producto
               { wch: 15 }, // Código
               { wch: 20 }, // Motivo
               { wch: 10 }, // Cantidad
               { wch: 15 }, // Costo Unitario
               { wch: 15 }, // Valor Total
               { wch: 15 }, // Stock Anterior
               { wch: 15 }, // Stock Nuevo
               { wch: 20 }, // Documento Referencia
               { wch: 30 }, // Observaciones
               { wch: 20 }  // Usuario
          ];
          ws['!cols'] = colWidths;

          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Movimientos KARDEX');

          // Generar el nombre del archivo con fecha
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0];
          const fileName = `KARDEX_Movimientos_${dateStr}.xlsx`;

          // Guardar el archivo
          XLSX.writeFile(wb, fileName);

          console.log(`Archivo exportado: ${fileName}`);
     }

     viewMovementDetail(movement: InventoryMovementDTO): void {
          this.selectedMovement = movement;

          // Cargar datos del usuario que realizó el movimiento
          if (movement.userId) {
               this.loadClientData(movement.userId);
          } else {
               this.selectedClient = null;
          }
     } closeMovementDetail(): void {
          this.selectedMovement = null;
          this.selectedClient = null;
          this.loadingClient = false;
     }

     /**
      * Calcula el costo total del movimiento (cantidad × costo unitario)
      */
     calculateTotalCost(movement: InventoryMovementDTO): number {
          return (movement.quantity || 0) * (movement.unitCost || 0);
     }

     /**
      * Carga los datos del cliente por ID
      */
     private loadClientData(clientId: string): void {
          this.loadingClient = true;
          this.selectedClient = null;

          this.userService.getUserById(clientId)
               .pipe(takeUntil(this.destroy$))
               .subscribe({
                    next: (userData) => {
                         this.selectedClient = userData;
                         this.loadingClient = false;
                    },
                    error: (error) => {
                         console.error('Error loading client data:', error);
                         this.loadingClient = false;
                    }
               });
     }

     createNewMovement(): void {
          this.router.navigate(['/admin/inventory/movements/new']);
     }

     // Pagination Methods
     goToPage(page: number): void {
          this.currentPage = page;
          this.loadMovements();
     }

     nextPage(): void {
          if (this.hasNextPage()) {
               this.currentPage++;
               this.loadMovements();
          }
     }

     previousPage(): void {
          if (this.hasPreviousPage()) {
               this.currentPage--;
               this.loadMovements();
          }
     }

     hasNextPage(): boolean {
          if (!this.totalMovements || this.pageSize <= 0) return false;
          return (this.currentPage + 1) * this.pageSize < this.totalMovements;
     }

     hasPreviousPage(): boolean {
          return this.currentPage > 0;
     }

     getTotalPages(): number {
          if (!this.totalMovements || this.pageSize <= 0) return 1;
          return Math.ceil(this.totalMovements / this.pageSize);
     }

     getPageNumbers(): number[] {
          const totalPages = this.getTotalPages();
          if (totalPages <= 1) return [0];

          const pages: number[] = [];
          let startPage = Math.max(0, this.currentPage - 2);
          let endPage = Math.min(totalPages - 1, startPage + 4);

          if (endPage - startPage < 4) {
               startPage = Math.max(0, endPage - 4);
          }

          for (let i = startPage; i <= endPage; i++) {
               pages.push(i);
          }

          return pages;
     }

     // Helper Methods
     getMovementTypeConfig(type: string) {
          if (!type || !this.movementTypes) return this.movementTypes?.[0] || { value: '', label: 'Desconocido', class: 'text-gray-600 bg-gray-100' };
          return this.movementTypes.find(t => t.value === type) || this.movementTypes[0];
     }

     getMovementReasonLabel(reason: string): string {
          if (!reason || !this.movementReasons) return reason || 'Sin especificar';
          return this.movementReasons.find(r => r.value === reason)?.label || reason;
     }

     getProductName(productId: string): string {
          if (!productId || !this.products || this.products.length === 0) return 'Sin especificar';
          const product = this.products.find(p => p.productId === productId);
          return product ? product.productName : 'Producto no encontrado';
     }

     getMovementsCountByType(type: 'ENTRADA' | 'SALIDA' | 'AJUSTE'): number {
          if (!this.movements || this.movements.length === 0) return 0;
          return this.movements.filter(m => m.movementType === type).length;
     }

     formatDate(date: Date): string {
          return date.toISOString().split('T')[0];
     }

     formatDateTime(dateString: string): string {
          if (!dateString) return 'Sin fecha';
          try {
               return new Date(dateString).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
               });
          } catch (error) {
               return 'Fecha inválida';
          }
     }

     formatCurrency(amount: number): string {
          if (typeof amount !== 'number' || isNaN(amount)) return 'S/ 0.00';
          try {
               return new Intl.NumberFormat('es-PE', {
                    style: 'currency',
                    currency: 'PEN'
               }).format(amount);
          } catch (error) {
               return `S/ ${amount.toFixed(2)}`;
          }
     }

     trackByMovementId(index: number, movement: InventoryMovementDTO): string {
          return movement?.movementId || index.toString();
     }

     // ============ MÉTODOS PARA REGISTRO DE CONSUMO ============

     /**
      * Mostrar modal para registrar consumo
      */
     showConsumptionForm(): void {
          this.showConsumptionModal = true;
          this.resetConsumptionForm();
     }

     /**
      * Cerrar modal de consumo
      */
     closeConsumptionModal(): void {
          this.showConsumptionModal = false;
          this.resetConsumptionForm();
     }

     /**
      * Resetear formulario de consumo
      */
     private resetConsumptionForm(): void {
          this.consumptionForm.reset({
               movementReason: 'USO_INTERNO',
               quantity: '',
               unitCost: 0,
               previousStock: 0,
               newStock: 0,
               productId: '',
               referenceDocument: ''
          });
          this.submittingConsumption = false;
     }

     /**
      * Calcular nuevo stock automáticamente
      */
     private calculateNewStock(): void {
          const quantity = this.consumptionForm.get('quantity')?.value || 0;
          const previousStock = this.consumptionForm.get('previousStock')?.value || 0;

          if (quantity > 0 && previousStock >= 0) {
               const newStock = Math.max(0, previousStock - quantity);
               this.consumptionForm.patchValue({ newStock }, { emitEvent: false });
          }
     }

     /**
      * Obtener stock y costo actual del producto seleccionado
      */
     onProductChange(): void {
          const productId = this.consumptionForm.get('productId')?.value;
          const organizationId = this.authService.getCurrentUser()?.organizationId;

          if (productId && organizationId) {
               console.log('📦 Getting product data for:', productId);

               // Buscar el producto en la lista ya cargada
               const selectedProduct = this.products.find(p => p.productId === productId);

               if (selectedProduct) {
                    // Usar directamente los datos del producto que ya están actualizados
                    console.log('💰 Unit cost from product:', selectedProduct.unitCost);
                    console.log('📊 Current stock from product:', selectedProduct.currentStock);

                    this.consumptionForm.patchValue({
                         unitCost: selectedProduct.unitCost || 0,
                         previousStock: selectedProduct.currentStock || 0
                    });
                    this.calculateNewStock();
               } else {
                    console.warn('⚠️ Product not found in products list');
                    this.consumptionForm.patchValue({
                         previousStock: 0,
                         unitCost: 0,
                         newStock: 0
                    });
               }
          } else {
               // Limpiar los campos si no hay producto seleccionado
               this.consumptionForm.patchValue({
                    previousStock: 0,
                    unitCost: 0,
                    newStock: 0
               });
          }
     }

     /**
      * Calcular valor total del consumo
      */
     calculateTotalConsumptionValue(): number {
          const quantity = this.consumptionForm.get('quantity')?.value || 0;
          const unitCost = this.consumptionForm.get('unitCost')?.value || 0;
          return quantity * unitCost;
     }

     /**
      * Validar que hay stock suficiente
      */
     hassufficientStock(): boolean {
          const quantity = this.consumptionForm.get('quantity')?.value || 0;
          const previousStock = this.consumptionForm.get('previousStock')?.value || 0;
          return previousStock >= quantity;
     }

     /**
      * Validar que el producto tiene stock disponible (mayor a 0)
      */
     hasProductStock(): boolean {
          const previousStock = this.consumptionForm.get('previousStock')?.value || 0;
          return previousStock > 0;
     }

     /**
      * Enviar formulario de consumo
      */
     submitConsumption(): void {
          if (this.consumptionForm.valid && !this.submittingConsumption) {
               // Validar si el producto tiene stock
               if (!this.hasProductStock()) {
                    Swal.fire({
                         icon: 'warning',
                         title: 'Producto sin stock',
                         text: 'Este producto no tiene stock disponible. No se puede realizar la salida.',
                         confirmButtonText: 'Entendido',
                         confirmButtonColor: '#dc2626'
                    });
                    return;
               }

               // Validar si hay stock suficiente
               if (!this.hassufficientStock()) {
                    const quantity = this.consumptionForm.get('quantity')?.value || 0;
                    const previousStock = this.consumptionForm.get('previousStock')?.value || 0;

                    Swal.fire({
                         icon: 'error',
                         title: 'Stock insuficiente',
                         html: `
                              <div class="text-left">
                                   <p><strong>Stock actual:</strong> ${previousStock} unidades</p>
                                   <p><strong>Cantidad solicitada:</strong> ${quantity} unidades</p>
                                   <p><strong>Faltante:</strong> ${quantity - previousStock} unidades</p>
                              </div>
                         `,
                         confirmButtonText: 'Entendido',
                         confirmButtonColor: '#dc2626'
                    });
                    return;
               }

               this.submittingConsumption = true;
               const organizationId = this.authService.getCurrentUser()?.organizationId;
               const userId = this.authService.getCurrentUser()?.id;

               if (!organizationId || !userId) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Error de autenticación',
                         text: 'No se pudo obtener información del usuario. Por favor, inicie sesión nuevamente.',
                         confirmButtonText: 'Entendido',
                         confirmButtonColor: '#dc2626'
                    });
                    this.submittingConsumption = false;
                    return;
               }

               const formData = this.consumptionForm.value;
               const consumptionData = {
                    organizationId,
                    userId,
                    productId: formData.productId,
                    quantity: parseInt(formData.quantity),
                    unitCost: parseFloat(formData.unitCost),
                    movementReason: formData.movementReason,
                    referenceDocument: formData.referenceDocument,
                    referenceId: formData.referenceId,
                    previousStock: parseInt(formData.previousStock),
                    newStock: parseInt(formData.newStock)
               };

               console.log('🍽️ Submitting consumption data:', consumptionData);

               this.inventoryMovementService.registerConsumption(consumptionData)
                    .pipe(takeUntil(this.destroy$))
                    .subscribe({
                         next: (response) => {
                              console.log('✅ Consumption registered successfully:', response);

                              // Obtener información del producto para el mensaje
                              const productId = this.consumptionForm.get('productId')?.value;
                              const selectedProduct = this.products.find(p => p.productId === productId);
                              const productName = selectedProduct ? selectedProduct.productName : 'Producto';
                              const quantity = this.consumptionForm.get('quantity')?.value;
                              const newStock = this.consumptionForm.get('newStock')?.value;

                              Swal.fire({
                                   icon: 'success',
                                   title: '¡Consumo registrado exitosamente!',
                                   html: `
                                        <div class="text-left">
                                             <p><strong>Producto:</strong> ${productName}</p>
                                             <p><strong>Cantidad consumida:</strong> ${quantity} unidades</p>
                                             <p><strong>Nuevo stock:</strong> ${newStock} unidades</p>
                                        </div>
                                   `,
                                   confirmButtonText: 'Aceptar',
                                   confirmButtonColor: '#059669'
                              });

                              this.closeConsumptionModal();
                              this.loadMovements(); // Recargar la lista
                              this.loadProducts(); // Recargar productos para actualizar stock
                         },
                         error: (error) => {
                              console.error('❌ Error registering consumption:', error);
                              let errorTitle = 'Error al registrar consumo';
                              let errorText = 'Ha ocurrido un problema al procesar la solicitud.';

                              // Mejorar manejo de errores específicos
                              if (error.status === 500) {
                                   errorTitle = 'Error del servidor';
                                   errorText = 'Error interno del servidor. El movimiento podría haberse registrado parcialmente. Verifica la lista de movimientos.';
                              } else if (error.error?.message) {
                                   errorText = error.error.message;
                              } else if (error.message) {
                                   errorText = error.message;
                              }

                              Swal.fire({
                                   icon: 'error',
                                   title: errorTitle,
                                   text: errorText,
                                   confirmButtonText: 'Entendido',
                                   confirmButtonColor: '#dc2626'
                              });

                              this.submittingConsumption = false;

                              // Intentar recargar la lista por si el movimiento se registró parcialmente
                              console.log('🔄 Intentando recargar la lista por si el movimiento se registró...');
                              this.loadMovements();
                              this.loadProducts();
                         }
                    });
          } else {
               console.warn('⚠️ Form is invalid or submission in progress');
               this.markFormGroupTouched(this.consumptionForm);
          }
     }

     /**
      * Marcar todos los campos como tocados para mostrar errores
      */
     private markFormGroupTouched(formGroup: FormGroup): void {
          Object.keys(formGroup.controls).forEach(key => {
               const control = formGroup.get(key);
               control?.markAsTouched();
          });
     }

     /**
      * Verificar si un campo tiene error específico
      */
     hasFieldError(fieldName: string, errorType: string): boolean {
          const field = this.consumptionForm.get(fieldName);
          return !!(field?.hasError(errorType) && field?.touched);
     }

     /**
      * Obtener mensaje de error para un campo
      */
     getFieldErrorMessage(fieldName: string): string {
          const field = this.consumptionForm.get(fieldName);
          if (field?.hasError('required')) return 'Este campo es requerido';
          if (field?.hasError('min')) return 'El valor debe ser mayor a ' + field.getError('min').min;
          return '';
     }
}
