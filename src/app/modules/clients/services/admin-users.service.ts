import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { StatusUsers } from '../../../core/models/user.model';
import { ApiResponse } from '../../../core/models/common.model';
import {
     UserWithLocationResponse,
     CreateUserRequest,
     UpdateUserPatchRequest,
     UserCreationResponse,
     PagedClientResponse,
     ClientFilters,
     UserCodeResponse
} from '../models/admin-client.model';

/**
 * Servicio para administrar usuarios/clientes conectándose directamente
 * a la API de ms-users (https://lab.vallegrande.edu.pe/jass/ms-users)
 * Implementa todas las operaciones del AdminRest
 */
@Injectable({
     providedIn: 'root'
})
export class AdminUsersService {

     private readonly baseUrl = 'https://lab.vallegrande.edu.pe/jass/ms-users/api/admin';

     constructor(private http: HttpClient) { }

     /**
      * Headers con autenticación requerida por el gateway
      */
     private getHeaders(): HttpHeaders {
          let headers = new HttpHeaders({
               'Content-Type': 'application/json',
               'Accept': 'application/json'
          });

          const token = localStorage.getItem('token');
          if (token) {
               headers = headers.set('Authorization', `Bearer ${token}`);
          }

          return headers;
     }

     /**
      * Manejo centralizado de errores
      */
     private handleError(error: any): Observable<never> {
          console.error('Admin Users API Error:', error);

          if (error.status === 401) {
               localStorage.removeItem('token');
               localStorage.removeItem('refreshToken');
               localStorage.removeItem('currentUser');
               // Podrías redirigir al login aquí
          }

          return throwError(() => error);
     }

     // ==================== CRUD OPERATIONS ====================

     /**
      * Crear nuevo cliente
      * POST /api/admin/clients
      * Solo puede crear usuarios con rol CLIENT
      */
     createClient(request: CreateUserRequest): Observable<ApiResponse<UserCreationResponse>> {
          return this.http.post<ApiResponse<UserCreationResponse>>(`${this.baseUrl}/clients`, request, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener todos los clientes de la organización del admin
      * GET /api/admin/clients/all
      * Requiere organizationId como parámetro
      */
     getClients(organizationId: string): Observable<ApiResponse<UserWithLocationResponse[]>> {
          let params = new HttpParams().set('organizationId', organizationId);

          return this.http.get<ApiResponse<UserWithLocationResponse[]>>(`${this.baseUrl}/clients/all`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener clientes con paginación (método alternativo si la API lo soporta)
      * GET /api/admin/clients
      * @deprecated Usar getClients(organizationId) que usa /clients/all
      */
     getClientsWithPagination(page: number = 0, size: number = 10): Observable<ApiResponse<PagedClientResponse>> {
          let params = new HttpParams()
               .set('page', page.toString())
               .set('size', size.toString());

          return this.http.get<ApiResponse<PagedClientResponse>>(`${this.baseUrl}/clients`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener cliente específico por ID
      * GET /api/admin/clients/{id}
      */
     getClientById(id: string): Observable<ApiResponse<UserWithLocationResponse>> {
          return this.http.get<ApiResponse<UserWithLocationResponse>>(`${this.baseUrl}/clients/${id}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Actualizar cliente parcialmente
      * PATCH /api/admin/clients/{id}
      */
     updateClient(id: string, request: UpdateUserPatchRequest): Observable<ApiResponse<UserWithLocationResponse>> {
          return this.http.patch<ApiResponse<UserWithLocationResponse>>(`${this.baseUrl}/clients/${id}`, request, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Cambiar estado de cliente
      * PATCH /api/admin/clients/{id}/status
      */
     changeClientStatus(id: string, status: StatusUsers): Observable<ApiResponse<UserWithLocationResponse>> {
          let params = new HttpParams().set('status', status.toString());

          return this.http.patch<ApiResponse<UserWithLocationResponse>>(`${this.baseUrl}/clients/${id}/status`, {}, {
               headers: this.getHeaders(),
               params
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Eliminar cliente
      * DELETE /api/admin/clients/{id}
      */
     deleteClient(id: string): Observable<ApiResponse<void>> {
          return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/clients/${id}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Restaurar cliente eliminado
      * PUT /api/admin/clients/{id}/restore
      */
     restoreClient(id: string): Observable<ApiResponse<UserWithLocationResponse>> {
          return this.http.put<ApiResponse<UserWithLocationResponse>>(`${this.baseUrl}/clients/${id}/restore`, {}, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== FILTERED LISTS ====================

     /**
      * Obtener clientes activos de una organización específica
      * GET /api/admin/clients/active
      */
     getActiveClients(organizationId: string): Observable<ApiResponse<UserWithLocationResponse[]>> {
          let params = new HttpParams().set('organizationId', organizationId);

          return this.http.get<ApiResponse<UserWithLocationResponse[]>>(`${this.baseUrl}/clients/active`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener clientes inactivos de una organización específica
      * GET /api/admin/clients/inactive
      */
     getInactiveClients(organizationId: string): Observable<ApiResponse<UserWithLocationResponse[]>> {
          let params = new HttpParams().set('organizationId', organizationId);

          return this.http.get<ApiResponse<UserWithLocationResponse[]>>(`${this.baseUrl}/clients/inactive`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener todos los clientes de una organización específica (activos e inactivos)
      * GET /api/admin/clients/all
      */
     getAllClientsByOrganization(organizationId: string): Observable<ApiResponse<UserWithLocationResponse[]>> {
          let params = new HttpParams().set('organizationId', organizationId);

          return this.http.get<ApiResponse<UserWithLocationResponse[]>>(`${this.baseUrl}/clients/all`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== USER CODE OPERATIONS ====================

     /**
      * Generar código de usuario para la organización del admin
      * POST /api/admin/user-codes/generate
      */
     generateUserCode(): Observable<ApiResponse<string>> {
          return this.http.post<ApiResponse<string>>(`${this.baseUrl}/user-codes/generate`, {}, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener próximo código de usuario para la organización del admin
      * GET /api/admin/user-codes/next
      */
     getNextUserCode(): Observable<ApiResponse<string>> {
          return this.http.get<ApiResponse<string>>(`${this.baseUrl}/user-codes/next`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== UTILITY METHODS ====================

     /**
      * Buscar clientes usando el endpoint /clients/all
      * Requiere organizationId
      */
     searchClients(organizationId: string, searchTerm?: string): Observable<ApiResponse<UserWithLocationResponse[]>> {
          // Usamos el endpoint /clients/all y luego filtramos localmente si es necesario
          // El filtro por searchTerm se puede implementar en el frontend
          return this.getClients(organizationId);
     }

     /**
      * Obtener clientes por estado usando los endpoints específicos
      */
     getClientsByStatus(organizationId: string, status: StatusUsers): Observable<ApiResponse<UserWithLocationResponse[]>> {
          switch (status) {
               case StatusUsers.ACTIVE:
                    return this.getActiveClients(organizationId);
               case StatusUsers.INACTIVE:
                    return this.getInactiveClients(organizationId);
               default:
                    return this.getAllClientsByOrganization(organizationId);
          }
     }

     // ==================== BATCH OPERATIONS ====================

     /**
      * Cambiar estado de múltiples clientes
      */
     batchChangeClientStatus(clientIds: string[], status: StatusUsers): Observable<ApiResponse<UserWithLocationResponse>[]> {
          const requests = clientIds.map(id => this.changeClientStatus(id, status));

          return new Observable(observer => {
               Promise.all(requests.map(req => req.toPromise()))
                    .then(results => {
                         const validResults = results.filter(result => result !== undefined) as ApiResponse<UserWithLocationResponse>[];
                         observer.next(validResults);
                         observer.complete();
                    })
                    .catch(error => observer.error(error));
          });
     }

     /**
      * Eliminar múltiples clientes
      */
     batchDeleteClients(clientIds: string[]): Observable<ApiResponse<void>[]> {
          const requests = clientIds.map(id => this.deleteClient(id));

          return new Observable(observer => {
               Promise.all(requests.map(req => req.toPromise()))
                    .then(results => {
                         const validResults = results.filter(result => result !== undefined) as ApiResponse<void>[];
                         observer.next(validResults);
                         observer.complete();
                    })
                    .catch(error => observer.error(error));
          });
     }

     /**
      * Restaurar múltiples clientes
      */
     batchRestoreClients(clientIds: string[]): Observable<ApiResponse<UserWithLocationResponse>[]> {
          const requests = clientIds.map(id => this.restoreClient(id));

          return new Observable(observer => {
               Promise.all(requests.map(req => req.toPromise()))
                    .then(results => {
                         const validResults = results.filter(result => result !== undefined) as ApiResponse<UserWithLocationResponse>[];
                         observer.next(validResults);
                         observer.complete();
                    })
                    .catch(error => observer.error(error));
          });
     }

     // ==================== HELPER METHODS ====================

     /**
      * Verificar si el servicio está disponible
      */
     checkServiceHealth(): Observable<any> {
          return this.http.get(`https://lab.vallegrande.edu.pe/jass/ms-users/actuator/health`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Construir parámetros HTTP a partir de filtros
      */
     private buildHttpParams(filters: ClientFilters): HttpParams {
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
          if (filters.organizationId) {
               params = params.set('organizationId', filters.organizationId);
          }

          return params;
     }
}
