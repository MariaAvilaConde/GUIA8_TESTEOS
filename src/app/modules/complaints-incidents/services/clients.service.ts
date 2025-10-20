import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ClientData {
     id: string;
     userCode: string;
     firstName: string;
     lastName: string;
     documentType: 'DNI' | 'PASSPORT' | 'OTHER';
     documentNumber: string;
     email: string;
     phone: string;
     address: string;
     roles: string[];
     status: 'ACTIVE' | 'INACTIVE';
     createdAt: string;
     updatedAt: string;
     organization: {
          organizationId: string;
          organizationCode: string;
          organizationName: string;
          legalRepresentative: string;
          address: string;
          phone: string;
          status: string;
     };
     zone: {
          zoneId: string;
          zoneCode: string;
          zoneName: string;
          description: string;
          status: string;
     };
     street: {
          streetId: string;
          streetCode: string;
          streetName: string;
          streetType: string;
          status: string;
     };
}

export interface ClientResponse {
     success: boolean;
     message: string;
     data: ClientData[];
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
export class ClientsService {
     private baseUrl = 'https://lab.vallegrande.edu.pe/jass/ms-users';

     constructor(private http: HttpClient) { }

     private getHeaders(): HttpHeaders {
          const token = localStorage.getItem('token');
          console.log('🔑 ClientsService - Token from localStorage:', token ? 'presente' : 'no encontrado');

          return new HttpHeaders({
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json',
               'Accept': 'application/json'
          });
     }

     getAllClients(organizationId: string): Observable<ClientData[]> {
          console.log('📞 ClientsService - Llamando getAllClients con organizationId:', organizationId);

          const params = new HttpParams().set('organizationId', organizationId);
          const url = `${this.baseUrl}/api/admin/clients/all`;

          console.log('🔗 ClientsService - URL completa:', url);
          console.log('📋 ClientsService - Parámetros:', { organizationId });

          return this.http.get<ClientResponse>(url, {
               headers: this.getHeaders(),
               params: params
          }).pipe(
               map((response: ClientResponse) => {
                    console.log('✅ ClientsService - Respuesta completa:', response);

                    if (response.success && response.data) {
                         console.log('📊 ClientsService - Clientes encontrados:', response.data.length);
                         return response.data;
                    } else {
                         console.log('⚠️ ClientsService - Respuesta sin éxito o sin datos');
                         return [];
                    }
               }),
               catchError((error) => {
                    console.error('❌ ClientsService - Error al obtener clientes:', error);
                    return throwError(() => new Error('Error al cargar clientes: ' + error.message));
               })
          );
     }
}
