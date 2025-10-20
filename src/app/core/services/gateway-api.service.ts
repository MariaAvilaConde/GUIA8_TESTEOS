import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiError } from '../models/common.model';

@Injectable({
     providedIn: 'root'
})
export class GatewayApiService {
     private readonly baseUrl = environment.gatewayUrl || 'http://localhost:9090';

     constructor(private http: HttpClient) { }

     /**
      * Headers comunes para las peticiones
      */
     private getHeaders(): HttpHeaders {
          let headers = new HttpHeaders({
               'Content-Type': 'application/json'
          });

          const token = localStorage.getItem('token');
          if (token) {
               headers = headers.set('Authorization', `Bearer ${token}`);
          }

          return headers;
     }

     /**
      * Manejo de errores común
      */
     private handleError(error: any): Observable<never> {
          console.error('Gateway API Error:', error);

          if (error.status === 401) {
               localStorage.removeItem('token');
               localStorage.removeItem('refreshToken');
               localStorage.removeItem('currentUser');
          }

          return throwError(() => error);
     }

     /**
      * GET request para autenticación
      */
     getAuth<T>(endpoint: string, params?: HttpParams): Observable<T> {
          return this.http.get<ApiResponse<T>>(`${this.baseUrl}/auth${endpoint}`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * POST request para autenticación
      */
     postAuth<T>(endpoint: string, data: any): Observable<T> {
          return this.http.post<ApiResponse<T>>(`${this.baseUrl}/auth${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PUT request para autenticación
      */
     putAuth<T>(endpoint: string, data: any): Observable<T> {
          return this.http.put<ApiResponse<T>>(`${this.baseUrl}/auth${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * DELETE request para autenticación
      */
     deleteAuth<T>(endpoint: string): Observable<T> {
          return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/auth${endpoint}`, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * POST request para autenticación que devuelve la respuesta completa (para login)
      */
     postAuthWithFullResponse<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
          return this.http.post<ApiResponse<T>>(`${this.baseUrl}/auth${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * GET request para autenticación que devuelve la respuesta completa
      */
     getAuthWithFullResponse<T>(endpoint: string, params?: HttpParams): Observable<ApiResponse<T>> {
          return this.http.get<ApiResponse<T>>(`${this.baseUrl}/auth${endpoint}`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== USUARIOS ROUTES ====================

     /**
      * GET request para management (SUPER_ADMIN)
      */
     getManagement<T>(endpoint: string, params?: HttpParams): Observable<T> {
          return this.http.get<ApiResponse<T>>(`${this.baseUrl}/management${endpoint}`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * POST request para management (SUPER_ADMIN)
      */
     postManagement<T>(endpoint: string, data: any): Observable<T> {
          return this.http.post<ApiResponse<T>>(`${this.baseUrl}/management${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PUT request para management (SUPER_ADMIN)
      */
     putManagement<T>(endpoint: string, data: any): Observable<T> {
          return this.http.put<ApiResponse<T>>(`${this.baseUrl}/management${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PATCH request para management (SUPER_ADMIN)
      */
     patchManagement<T>(endpoint: string, data: any): Observable<T> {
          return this.http.patch<ApiResponse<T>>(`${this.baseUrl}/management${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * DELETE request para management (SUPER_ADMIN)
      */
     deleteManagement<T>(endpoint: string): Observable<T> {
          return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/management${endpoint}`, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * GET request para admin (ADMIN)
      */
     getAdmin<T>(endpoint: string, params?: HttpParams): Observable<T> {
          return this.http.get<ApiResponse<T>>(`${this.baseUrl}/admin${endpoint}`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * POST request para admin (ADMIN)
      */
     postAdmin<T>(endpoint: string, data: any): Observable<T> {
          return this.http.post<ApiResponse<T>>(`${this.baseUrl}/admin${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PUT request para admin (ADMIN)
      */
     putAdmin<T>(endpoint: string, data: any): Observable<T> {
          return this.http.put<ApiResponse<T>>(`${this.baseUrl}/admin${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PATCH request para admin (ADMIN)
      */
     patchAdmin<T>(endpoint: string, data: any): Observable<T> {
          return this.http.patch<ApiResponse<T>>(`${this.baseUrl}/admin${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * DELETE request para admin (ADMIN)
      */
     deleteAdmin<T>(endpoint: string): Observable<T> {
          return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/admin${endpoint}`, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * GET request para client (CLIENT)
      */
     getClient<T>(endpoint: string, params?: HttpParams): Observable<T> {
          return this.http.get<ApiResponse<T>>(`${this.baseUrl}/client${endpoint}`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * POST request para client (CLIENT)
      */
     postClient<T>(endpoint: string, data: any): Observable<T> {
          return this.http.post<ApiResponse<T>>(`${this.baseUrl}/client${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PUT request para client (CLIENT)
      */
     putClient<T>(endpoint: string, data: any): Observable<T> {
          return this.http.put<ApiResponse<T>>(`${this.baseUrl}/client${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PATCH request para client (CLIENT)
      */
     patchClient<T>(endpoint: string, data: any): Observable<T> {
          return this.http.patch<ApiResponse<T>>(`${this.baseUrl}/client${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * DELETE request para client (CLIENT)
      */
     deleteClient<T>(endpoint: string): Observable<T> {
          return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/client${endpoint}`, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * GET request para common (rutas públicas y autenticadas)
      */
     getCommon<T>(endpoint: string, params?: HttpParams): Observable<T> {
          return this.http.get<ApiResponse<T>>(`${this.baseUrl}/common${endpoint}`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * POST request para common (rutas públicas y autenticadas)
      */
     postCommon<T>(endpoint: string, data: any): Observable<T> {
          return this.http.post<ApiResponse<T>>(`${this.baseUrl}/common${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PUT request para common (rutas públicas y autenticadas)
      */
     putCommon<T>(endpoint: string, data: any): Observable<T> {
          return this.http.put<ApiResponse<T>>(`${this.baseUrl}/common${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * PATCH request para common (rutas públicas y autenticadas)
      */
     patchCommon<T>(endpoint: string, data: any): Observable<T> {
          return this.http.patch<ApiResponse<T>>(`${this.baseUrl}/common${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * DELETE request para common (rutas públicas y autenticadas)
      */
     deleteCommon<T>(endpoint: string): Observable<T> {
          return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/common${endpoint}`, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * GET request para internal (microservicios)
      */
     getInternal<T>(endpoint: string, params?: HttpParams): Observable<T> {
          return this.http.get<ApiResponse<T>>(`${this.baseUrl}/internal${endpoint}`, {
               headers: this.getHeaders(),
               params
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * POST request para internal (microservicios)
      */
     postInternal<T>(endpoint: string, data: any): Observable<T> {
          return this.http.post<ApiResponse<T>>(`${this.baseUrl}/internal${endpoint}`, data, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }

     /**
      * GET con URL completa (para verificar health del gateway)
      */
     getHealthCheck(): Observable<any> {
          return this.http.get(`${this.baseUrl}/actuator/health`).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * GET user by ID usando directamente el microservicio de usuarios
      */
     getUserById<T>(userId: string): Observable<T> {
          const usersServiceUrl = 'https://lab.vallegrande.edu.pe/jass/ms-users/internal';
          return this.http.get<ApiResponse<T>>(`${usersServiceUrl}/users/${userId}`, {
               headers: this.getHeaders()
          }).pipe(
               map(response => response.data),
               catchError(this.handleError)
          );
     }
}
