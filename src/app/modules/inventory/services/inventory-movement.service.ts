import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface InventoryMovementDTO {
     movementId: string;
     organizationId: string;
     productId: string;
     productName?: string;
     productCode?: string;
     movementType: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
     movementReason: 'COMPRA' | 'VENTA' | 'DEVOLUCION' | 'AJUSTE_INVENTARIO' | 'TRANSFERENCIA' | 'MERMA' | 'OTRO';
     quantity: number;
     unitCost: number;
     totalValue: number;
     previousStock: number;
     newStock: number;
     referenceDocument?: string;
     referenceId?: string;
     observations?: string;
     movementDate: string;
     userId: string;
     userName?: string;
     createdAt: string;
}

export interface InventoryMovementFilterDTO {
     organizationId: string;
     productId?: string;
     movementType?: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
     movementReason?: 'COMPRA' | 'VENTA' | 'DEVOLUCION' | 'AJUSTE_INVENTARIO' | 'TRANSFERENCIA' | 'MERMA' | 'OTRO';
     startDate?: string;
     endDate?: string;
     page: number;
     size: number;
     sortBy: string;
     sortDirection: 'ASC' | 'DESC';
}

export interface CreateInventoryMovementDTO {
     organizationId: string;
     productId: string;
     movementType: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
     movementReason: 'COMPRA' | 'VENTA' | 'DEVOLUCION' | 'AJUSTE_INVENTARIO' | 'TRANSFERENCIA' | 'MERMA' | 'OTRO' | 'USO_INTERNO';
     quantity: number;
     unitCost: number;
     referenceDocument?: string;
     referenceId?: string;
     observations?: string;
     movementDate: string;
     userId: string;
}

export interface ConsumptionMovementDTO {
     organizationId: string;
     productId: string;
     quantity: number;
     unitCost: number;
     movementReason: 'USO_INTERNO' | 'VENTA' | 'MERMA' | 'TRANSFERENCIA' | 'OTRO';
     userId: string;
     referenceDocument?: string;
     referenceId?: string;
     observations?: string;
     previousStock: number;
     newStock: number;
}

export interface StockSummary {
     productId: string;
     productCode: string;
     productName: string;
     currentStock: number;
     minimumStock?: number;
     maximumStock?: number;
     lastMovementDate?: string;
     lastMovementType?: string;
     stockStatus: 'NORMAL' | 'CRITICO' | 'AGOTADO';
}

@Injectable({
     providedIn: 'root'
})
export class InventoryMovementService {

     private readonly apiUrl = `${environment.inventoryApiUrl}/inventory-movements`;

     constructor(private http: HttpClient) { }

     /**
      * Obtener movimientos por organización con paginación
      */
     getMovementsByOrganization(organizationId: string, page: number = 0, size: number = 20): Observable<InventoryMovementDTO[]> {
          // El endpoint backend no soporta paginación, devolvemos todos
          return this.http.get<InventoryMovementDTO[]>(`${this.apiUrl}/organization/${organizationId}`);
     }

     /**
      * Obtener movimientos con filtros avanzados
      * Como el backend solo tiene endpoints básicos, filtraremos del lado del cliente
      */
     getMovementsWithFilters(filters: InventoryMovementFilterDTO): Observable<InventoryMovementDTO[]> {
          const url = `${this.apiUrl}/organization/${filters.organizationId}`;
          console.log('🌐 Making API call to:', url);
          console.log('🔧 API Base URL:', this.apiUrl);
          console.log('🏢 Organization ID:', filters.organizationId);

          return this.http.get<InventoryMovementDTO[]>(url)
               .pipe(
                    tap(response => console.log('🔄 Raw API response:', response)),
                    catchError(error => {
                         console.error('💥 HTTP Error in getMovementsWithFilters:', error);
                         console.error('💥 Error Status:', error.status);
                         console.error('💥 Error Message:', error.message);
                         console.error('💥 Error URL:', error.url);

                         // TEMPORARY: Devolver datos de prueba si hay un error 404 o similar
                         if (error.status === 404 || error.status === 500) {
                              console.log('🔧 Returning test data due to API error');
                              return of([
                                   {
                                        movementId: 'test-001',
                                        organizationId: filters.organizationId,
                                        productId: 'prod-001',
                                        productName: 'Producto de Prueba 1',
                                        productCode: 'PROD001',
                                        movementType: 'ENTRADA' as const,
                                        movementReason: 'COMPRA' as const,
                                        quantity: 10,
                                        unitCost: 25.50,
                                        totalValue: 255.00,
                                        previousStock: 0,
                                        newStock: 10,
                                        referenceDocument: 'DOC-001',
                                        observations: 'Movimiento de prueba',
                                        movementDate: new Date().toISOString(),
                                        userId: 'user-001',
                                        userName: 'Usuario de Prueba',
                                        createdAt: new Date().toISOString()
                                   },
                                   {
                                        movementId: 'test-002',
                                        organizationId: filters.organizationId,
                                        productId: 'prod-002',
                                        productName: 'Producto de Prueba 2',
                                        productCode: 'PROD002',
                                        movementType: 'SALIDA' as const,
                                        movementReason: 'VENTA' as const,
                                        quantity: 5,
                                        unitCost: 15.75,
                                        totalValue: 78.75,
                                        previousStock: 10,
                                        newStock: 5,
                                        referenceDocument: 'DOC-002',
                                        observations: 'Venta de prueba',
                                        movementDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                                        userId: 'user-002',
                                        userName: 'Vendedor de Prueba',
                                        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                                   }
                              ]);
                         }

                         // Devolver array vacío para otros errores
                         return of([]);
                    }),
                    map(movements => {
                         console.log('🔄 Processing movements:', movements);
                         console.log('📅 Applied filters:', filters);
                         let filtered = movements || [];
                         console.log('📊 Initial movements count:', filtered.length);

                         // Aplicar filtros en el frontend
                         if (filters.productId) {
                              console.log('🔍 Filtering by productId:', filters.productId);
                              filtered = filtered.filter(m => m.productId === filters.productId);
                              console.log('📊 After productId filter:', filtered.length);
                         }

                         if (filters.movementType) {
                              console.log('🔍 Filtering by movementType:', filters.movementType);
                              filtered = filtered.filter(m => m.movementType === filters.movementType);
                              console.log('📊 After movementType filter:', filtered.length);
                         }

                         if (filters.movementReason) {
                              console.log('🔍 Filtering by movementReason:', filters.movementReason);
                              filtered = filtered.filter(m => m.movementReason === filters.movementReason);
                              console.log('📊 After movementReason filter:', filtered.length);
                         }

                         if (filters.startDate && filters.startDate.trim() !== '') {
                              const startDate = new Date(filters.startDate);
                              console.log('📅 Filtering by startDate:', filters.startDate, '→', startDate);
                              console.log('🔍 Sample movement dates:', filtered.slice(0, 3).map(m => ({
                                   id: m.movementId,
                                   date: m.movementDate,
                                   parsed: new Date(m.movementDate)
                              })));

                              const beforeFilter = filtered.length;
                              filtered = filtered.filter(m => {
                                   const movementDate = new Date(m.movementDate);
                                   const passes = movementDate >= startDate;
                                   if (!passes) {
                                        console.log('❌ Movement filtered out by startDate:', {
                                             movementId: m.movementId,
                                             movementDate: m.movementDate,
                                             parsedDate: movementDate,
                                             startDate: startDate,
                                             comparison: `${movementDate.toISOString()} >= ${startDate.toISOString()}`,
                                             result: passes
                                        });
                                   }
                                   return passes;
                              });
                              console.log('📊 After startDate filter:', beforeFilter, '→', filtered.length);
                         }

                         if (filters.endDate && filters.endDate.trim() !== '') {
                              const endDate = new Date(filters.endDate);
                              endDate.setHours(23, 59, 59, 999); // Incluir todo el día
                              console.log('📅 Filtering by endDate:', filters.endDate, '→', endDate);

                              const beforeFilter = filtered.length;
                              filtered = filtered.filter(m => {
                                   const movementDate = new Date(m.movementDate);
                                   const passes = movementDate <= endDate;
                                   if (!passes) {
                                        console.log('❌ Movement filtered out by endDate:', {
                                             movementId: m.movementId,
                                             movementDate: m.movementDate,
                                             parsedDate: movementDate,
                                             endDate: endDate,
                                             comparison: `${movementDate.toISOString()} <= ${endDate.toISOString()}`,
                                             result: passes
                                        });
                                   }
                                   return passes;
                              });
                              console.log('📊 After endDate filter:', beforeFilter, '→', filtered.length);
                         }                         // Aplicar ordenamiento
                         if (filters.sortBy && filters.sortDirection) {
                              filtered.sort((a, b) => {
                                   let aVal: any, bVal: any;

                                   switch (filters.sortBy) {
                                        case 'movementDate':
                                             aVal = new Date(a.movementDate);
                                             bVal = new Date(b.movementDate);
                                             break;
                                        case 'quantity':
                                             aVal = a.quantity;
                                             bVal = b.quantity;
                                             break;
                                        case 'unitCost':
                                             aVal = a.unitCost;
                                             bVal = b.unitCost;
                                             break;
                                        default:
                                             aVal = new Date(a.movementDate);
                                             bVal = new Date(b.movementDate);
                                   }

                                   if (aVal < bVal) return filters.sortDirection === 'ASC' ? -1 : 1;
                                   if (aVal > bVal) return filters.sortDirection === 'ASC' ? 1 : -1;
                                   return 0;
                              });
                         }

                         // Aplicar paginación si se especifica
                         if (filters.page !== undefined && filters.size !== undefined) {
                              const startIndex = filters.page * filters.size;
                              const endIndex = startIndex + filters.size;
                              filtered = filtered.slice(startIndex, endIndex);
                         }

                         console.log('✅ Filtered movements returned:', filtered);
                         return filtered;
                    })
               );
     }     /**
      * Obtener movimientos por producto
      */
     getMovementsByProduct(organizationId: string, productId: string): Observable<InventoryMovementDTO[]> {
          return this.http.get<InventoryMovementDTO[]>(`${this.apiUrl}/organization/${organizationId}/product/${productId}`);
     }

     /**
      * Obtener movimiento por ID
      */
     getMovementById(movementId: string): Observable<InventoryMovementDTO> {
          return this.http.get<InventoryMovementDTO>(`${this.apiUrl}/${movementId}`);
     }

     /**
      * Crear nuevo movimiento
      */
     createMovement(movement: CreateInventoryMovementDTO): Observable<InventoryMovementDTO> {
          return this.http.post<InventoryMovementDTO>(this.apiUrl, movement);
     }

     /**
      * Obtener stock actual de un producto
      */
     getCurrentStock(organizationId: string, productId: string): Observable<number> {
          return this.http.get<number>(`${this.apiUrl}/stock/${organizationId}/${productId}`);
     }

     /**
      * Obtener resumen de stock por organización
      * Como este endpoint no existe, retornamos un observable vacío
      */
     getStockSummary(organizationId: string): Observable<StockSummary[]> {
          // Este endpoint no existe en el backend, implementar cuando esté disponible
          return of([]);
     }

     /**
      * Contar movimientos por organización
      */
     countMovementsByOrganization(organizationId: string): Observable<number> {
          const url = `${this.apiUrl}/count/${organizationId}`;
          console.log('📊 Making count API call to:', url);

          return this.http.get<number>(url)
               .pipe(
                    tap(count => console.log('📊 Count API response:', count)),
                    catchError(error => {
                         console.error('💥 Count HTTP Error:', error);
                         console.error('💥 Count Error Status:', error.status);
                         console.error('💥 Count Error Message:', error.message);
                         console.error('💥 Count Error URL:', error.url);

                         // TEMPORARY: Devolver conteo de prueba si hay error 404 o similar
                         if (error.status === 404 || error.status === 500) {
                              console.log('🔧 Returning test count due to API error');
                              return of(2); // Corresponde a los 2 movimientos de prueba
                         }

                         // Devolver 0 para otros errores
                         return of(0);
                    })
               );
     }

     /**
      * Obtener movimientos por rango de fechas
      * Como este endpoint no existe, usamos el básico
      */
     getMovementsByDateRange(organizationId: string, startDate: string, endDate: string): Observable<InventoryMovementDTO[]> {
          // Este endpoint no existe, usar el básico y filtrar en el cliente
          return this.getMovementsByOrganization(organizationId);
     }

     /**
      * Registrar consumo de producto (movimiento de salida)
      */
     registerConsumption(consumptionData: ConsumptionMovementDTO): Observable<any> {
          console.log('🍽️ Registering product consumption:', consumptionData);
          return this.http.post(`${this.apiUrl}/consumption`, consumptionData)
               .pipe(
                    tap(response => console.log('✅ Consumption registered:', response)),
                    catchError(error => {
                         console.error('❌ Error registering consumption:', error);
                         throw error;
                    })
               );
     }

     /**
      * Obtener último movimiento de un producto
      */
     getLastMovement(organizationId: string, productId: string): Observable<InventoryMovementDTO> {
          const url = `${this.apiUrl}/last-movement/${organizationId}/${productId}`;
          console.log('🔍 Getting last movement:', url);
          return this.http.get<any>(url)
               .pipe(
                    map(response => response.data || response),
                    tap(movement => console.log('📋 Last movement:', movement)),
                    catchError(error => {
                         console.error('❌ Error getting last movement:', error);
                         throw error;
                    })
               );
     }
}
