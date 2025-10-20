import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { GatewayApiService } from '../../../core/services/gateway-api.service';
import { StatusUsers } from '../../../core/models/user.model';
import {
     UserWithLocationResponse,
     CreateUserRequest,
     UpdateUserPatchRequest,
     UserCreationResponse,
     PagedClientResponse,
     ClientFilters,
     UserCodeResponse,
     AdminClientResponse
} from '../models/admin-client.model';

/**
 * Servicio para administrar clientes usando las APIs del AdminRest
 * Conecta con el Gateway para acceder a las APIs de administración de usuarios
 * Ruta base: /admin (requiere rol ADMIN o SUPER_ADMIN)
 */
@Injectable({
     providedIn: 'root'
})
export class AdminClientService {

     constructor(private gatewayApiService: GatewayApiService) { }

     // ==================== CRUD OPERATIONS ====================

     /**
      * Crear nuevo cliente
      * POST /api/admin/clients
      */
     createClient(request: CreateUserRequest): Observable<AdminClientResponse> {
          return this.gatewayApiService.postAdmin<AdminClientResponse>('/clients', request);
     }

     /**
      * Obtener todos los clientes de la organización (con paginación)
      * GET /api/admin/clients
      */
     getClients(filters: ClientFilters = {}): Observable<PagedClientResponse> {
          let params = new HttpParams();

          if (filters.page !== undefined) {
               params = params.set('page', filters.page.toString());
          }
          if (filters.size !== undefined) {
               params = params.set('size', filters.size.toString());
          }
          if (filters.search) {
               params = params.set('search', filters.search);
          }
          if (filters.status) {
               params = params.set('status', filters.status);
          }

          return this.gatewayApiService.getAdmin<PagedClientResponse>('/clients', params);
     }

     /**
      * Obtener cliente específico por ID
      * GET /api/admin/clients/{id}
      */
     getClientById(id: string): Observable<AdminClientResponse> {
          return this.gatewayApiService.getAdmin<AdminClientResponse>(`/clients/${id}`);
     }

     /**
      * Actualizar cliente parcialmente
      * PATCH /api/admin/clients/{id}
      */
     updateClient(id: string, request: UpdateUserPatchRequest): Observable<AdminClientResponse> {
          return this.gatewayApiService.patchAdmin<AdminClientResponse>(`/clients/${id}`, request);
     }

     /**
      * Cambiar estado de cliente
      * PATCH /api/admin/clients/{id}/status
      */
     changeClientStatus(id: string, status: StatusUsers): Observable<AdminClientResponse> {
          let params = new HttpParams().set('status', status);
          return this.gatewayApiService.patchAdmin<AdminClientResponse>(`/clients/${id}/status?status=${status}`, {});
     }

     /**
      * Eliminar cliente
      * DELETE /api/admin/clients/{id}
      */
     deleteClient(id: string): Observable<AdminClientResponse> {
          return this.gatewayApiService.deleteAdmin<AdminClientResponse>(`/clients/${id}`);
     }

     /**
      * Restaurar cliente eliminado
      * PUT /api/admin/clients/{id}/restore
      */
     restoreClient(id: string): Observable<AdminClientResponse> {
          return this.gatewayApiService.putAdmin<AdminClientResponse>(`/clients/${id}/restore`, {});
     }

     // ==================== FILTERED LISTS ====================

     /**
      * Obtener clientes activos de una organización específica
      * GET /api/admin/clients/active
      */
     getActiveClients(organizationId: string): Observable<AdminClientResponse> {
          let params = new HttpParams().set('organizationId', organizationId);
          return this.gatewayApiService.getAdmin<AdminClientResponse>('/clients/active', params);
     }

     /**
      * Obtener clientes inactivos de una organización específica
      * GET /api/admin/clients/inactive
      */
     getInactiveClients(organizationId: string): Observable<AdminClientResponse> {
          let params = new HttpParams().set('organizationId', organizationId);
          return this.gatewayApiService.getAdmin<AdminClientResponse>('/clients/inactive', params);
     }

     /**
      * Obtener todos los clientes de una organización específica (activos e inactivos)
      * GET /api/admin/clients/all
      */
     getAllClientsByOrganization(organizationId: string): Observable<AdminClientResponse> {
          let params = new HttpParams().set('organizationId', organizationId);
          return this.gatewayApiService.getAdmin<AdminClientResponse>('/clients/all', params);
     }

     // ==================== USER CODE OPERATIONS ====================

     /**
      * Generar código de usuario para la organización del admin
      * POST /api/admin/user-codes/generate
      */
     generateUserCode(): Observable<UserCodeResponse> {
          return this.gatewayApiService.postAdmin<UserCodeResponse>('/user-codes/generate', {});
     }

     /**
      * Obtener próximo código de usuario para la organización del admin
      * GET /api/admin/user-codes/next
      */
     getNextUserCode(): Observable<UserCodeResponse> {
          return this.gatewayApiService.getAdmin<UserCodeResponse>('/user-codes/next');
     }

     // ==================== HELPER METHODS ====================

     /**
      * Método auxiliar para convertir filtros a parámetros HTTP
      */
     private buildHttpParams(filters: ClientFilters): HttpParams {
          let params = new HttpParams();

          Object.keys(filters).forEach(key => {
               const value = (filters as any)[key];
               if (value !== undefined && value !== null && value !== '') {
                    params = params.set(key, value.toString());
               }
          });

          return params;
     }

     /**
      * Método auxiliar para manejar respuestas con datos de ubicación
      */
     private enrichClientWithLocationData(client: any): UserWithLocationResponse {
          return {
               ...client,
               organization: client.organization || null,
               zone: client.zone || null,
               street: client.street || null
          };
     }

     // ==================== SEARCH AND FILTER OPERATIONS ====================

     /**
      * Buscar clientes por término de búsqueda
      */
     searchClients(searchTerm: string, organizationId?: string): Observable<PagedClientResponse> {
          const filters: ClientFilters = {
               search: searchTerm,
               organizationId: organizationId
          };
          return this.getClients(filters);
     }

     /**
      * Filtrar clientes por estado
      */
     getClientsByStatus(status: StatusUsers, organizationId?: string): Observable<AdminClientResponse> {
          if (status === StatusUsers.ACTIVE && organizationId) {
               return this.getActiveClients(organizationId);
          } else if (status === StatusUsers.INACTIVE && organizationId) {
               return this.getInactiveClients(organizationId);
          } else {
               // Para casos sin organizationId específica, retornamos el listado general paginado
               // convertido a AdminClientResponse
               return new Observable(observer => {
                    this.getClients({ status, organizationId }).subscribe({
                         next: (pagedResponse) => {
                              const adminResponse: AdminClientResponse = {
                                   success: true,
                                   message: 'Clientes obtenidos exitosamente',
                                   data: pagedResponse
                              };
                              observer.next(adminResponse);
                              observer.complete();
                         },
                         error: (error) => observer.error(error)
                    });
               });
          }
     }

     // ==================== BATCH OPERATIONS ====================

     /**
      * Operación batch para cambiar estado de múltiples clientes
      */
     batchChangeClientStatus(clientIds: string[], status: StatusUsers): Observable<AdminClientResponse[]> {
          const requests = clientIds.map(id => this.changeClientStatus(id, status));
          // En una implementación real, esto podría ser una sola llamada API
          // Por ahora, manejamos como múltiples llamadas
          return new Observable(observer => {
               Promise.all(requests.map(req => req.toPromise()))
                    .then(results => {
                         const validResults = results.filter(result => result !== undefined) as AdminClientResponse[];
                         observer.next(validResults);
                         observer.complete();
                    })
                    .catch(error => observer.error(error));
          });
     }

     /**
      * Operación batch para eliminar múltiples clientes
      */
     batchDeleteClients(clientIds: string[]): Observable<AdminClientResponse[]> {
          const requests = clientIds.map(id => this.deleteClient(id));
          return new Observable(observer => {
               Promise.all(requests.map(req => req.toPromise()))
                    .then(results => {
                         const validResults = results.filter(result => result !== undefined) as AdminClientResponse[];
                         observer.next(validResults);
                         observer.complete();
                    })
                    .catch(error => observer.error(error));
          });
     }
}
