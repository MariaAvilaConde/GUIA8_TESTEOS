import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Servicio para conectarse directamente a la API de ms-organization
 * https://lab.vallegrande.edu.pe/jass/ms-organization
 */
@Injectable({
     providedIn: 'root'
})
export class OrganizationApiService {

     private readonly baseUrl = 'https://lab.vallegrande.edu.pe/jass/ms-organization/api/admin';

     constructor(private http: HttpClient) { }

     /**
      * Headers con autenticación
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
      * Manejo de errores
      */
     private handleError(error: any): Observable<never> {
          console.error('Organization API Error:', error);
          return throwError(() => error);
     }

     // ==================== ORGANIZATION ENDPOINTS ====================

     /**
      * Ver mi organización
      * GET /api/admin/organization/{organizationId}
      */
     getOrganization(organizationId: string): Observable<any> {
          return this.http.get(`${this.baseUrl}/organization/${organizationId}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Resumen de mi organización
      * GET /api/admin/organization/{organizationId}/summary
      */
     getOrganizationSummary(organizationId: string): Observable<any> {
          return this.http.get(`${this.baseUrl}/organization/${organizationId}/summary`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== ZONES ENDPOINTS ====================

     /**
      * Listar todas las zonas
      * GET /api/admin/zones
      */
     getAllZones(): Observable<any> {
          return this.http.get(`${this.baseUrl}/zones`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener zonas por organización
      * GET /api/admin/zones/organization/{organizationId}
      */
     getZonesByOrganization(organizationId: string): Observable<any> {
          return this.http.get(`${this.baseUrl}/zones/organization/${organizationId}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener zona por ID
      * GET /api/admin/zones/{id}
      */
     getZoneById(id: string): Observable<any> {
          return this.http.get(`${this.baseUrl}/zones/${id}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Crear zona
      * POST /api/admin/zones
      */
     createZone(zoneData: any): Observable<any> {
          return this.http.post(`${this.baseUrl}/zones`, zoneData, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Actualizar zona
      * PUT /api/admin/zones/{id}
      */
     updateZone(id: string, zoneData: any): Observable<any> {
          return this.http.put(`${this.baseUrl}/zones/${id}`, zoneData, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Eliminar zona
      * DELETE /api/admin/zones/{id}
      */
     deleteZone(id: string): Observable<any> {
          return this.http.delete(`${this.baseUrl}/zones/${id}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Restaurar zona
      * PATCH /api/admin/zones/{id}/restore
      */
     restoreZone(id: string): Observable<any> {
          return this.http.patch(`${this.baseUrl}/zones/${id}/restore`, {}, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== STREETS ENDPOINTS ====================

     /**
      * Listar todas las calles
      * GET /api/admin/streets
      */
     getAllStreets(): Observable<any> {
          return this.http.get(`${this.baseUrl}/streets`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener calles por zona
      * GET /api/admin/streets/zone/{zoneId}
      */
     getStreetsByZone(zoneId: string): Observable<any> {
          return this.http.get(`${this.baseUrl}/streets/zone/${zoneId}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Obtener calle por ID
      * GET /api/admin/streets/{id}
      */
     getStreetById(id: string): Observable<any> {
          return this.http.get(`${this.baseUrl}/streets/${id}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Crear calle
      * POST /api/admin/streets
      */
     createStreet(streetData: any): Observable<any> {
          return this.http.post(`${this.baseUrl}/streets`, streetData, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Actualizar calle
      * PUT /api/admin/streets/{id}
      */
     updateStreet(id: string, streetData: any): Observable<any> {
          return this.http.put(`${this.baseUrl}/streets/${id}`, streetData, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Eliminar calle
      * DELETE /api/admin/streets/{id}
      */
     deleteStreet(id: string): Observable<any> {
          return this.http.delete(`${this.baseUrl}/streets/${id}`, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     /**
      * Restaurar calle
      * PATCH /api/admin/streets/{id}/restore
      */
     restoreStreet(id: string): Observable<any> {
          return this.http.patch(`${this.baseUrl}/streets/${id}/restore`, {}, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== UTILITY METHODS ====================

     /**
      * Verificar si el servicio está disponible
      */
     checkServiceHealth(): Observable<any> {
          return this.http.get('https://lab.vallegrande.edu.pe/jass/ms-organization/actuator/health', {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }

     // ==================== CLIENTS ENDPOINTS ====================

     /**
      * Crear cliente
      * POST /api/admin/clients
      */
     createClient(clientData: any): Observable<any> {
          return this.http.post(`${this.baseUrl}/clients`, clientData, {
               headers: this.getHeaders()
          }).pipe(
               catchError(this.handleError)
          );
     }
}
