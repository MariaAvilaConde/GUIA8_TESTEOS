import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AdminData {
     id: string;
     userCode: string;
     firstName: string;
     lastName: string;
     documentType: string;
     documentNumber: string;
     email: string;
     phone: string;
     address: string;
     roles: string[];
     status: 'ACTIVE' | 'INACTIVE';
     createdAt: string;
     updatedAt: string;
     organization: string;
     zone: string;
     street: string;
}

export interface AdminResponse {
     success: boolean;
     message: string;
     data: AdminData[];
     error?: {
          message: string;
          code: string;
          errorCode: string;
          httpStatus: number;
          details: string;
          timestamp: string;
     };
}

@Injectable({
     providedIn: 'root'
})
export class AdminsService {
     private baseUrl = 'https://lab.vallegrande.edu.pe/jass/ms-users';

     constructor(private http: HttpClient) { }

     private getHeaders(): HttpHeaders {
          const token = localStorage.getItem('token');
          console.log('🔑 AdminsService - Token from localStorage:', token ? 'presente' : 'no encontrado');

          return new HttpHeaders({
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json',
               'Accept': 'application/json'
          });
     }

     getOrganizationAdmins(organizationId: string): Observable<AdminData[]> {
          console.log('📞 AdminsService - Llamando getOrganizationAdmins con organizationId:', organizationId);

          const url = `${this.baseUrl}/internal/organizations/${organizationId}/admins`;

          console.log('🔗 AdminsService - URL completa:', url);

          return this.http.get<AdminResponse>(url, {
               headers: this.getHeaders()
          }).pipe(
               map((response: AdminResponse) => {
                    console.log('✅ AdminsService - Respuesta completa:', response);

                    if (response.success && response.data) {
                         console.log('📊 AdminsService - Administradores encontrados:', response.data.length);
                         return response.data;
                    } else {
                         console.log('⚠️ AdminsService - Respuesta sin éxito o sin datos');
                         return [];
                    }
               }),
               catchError((error) => {
                    console.error('❌ AdminsService - Error al obtener administradores:', error);
                    return throwError(() => new Error('Error al cargar administradores: ' + error.message));
               })
          );
     }
}
