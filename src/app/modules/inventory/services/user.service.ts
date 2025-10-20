import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Interfaces para la respuesta del API de usuarios
export interface UserOrganization {
     organizationCode: string;
     organizationId: string;
     status: string;
     address: string;
     phone: string;
     legalRepresentative: string;
     organizationName: string;
}

export interface UserZone {
     zoneId: string;
     status: string;
     zoneName: string;
     description: string;
     zoneCode: string;
}

export interface UserStreet {
     status: string;
     streetCode: string;
     streetId: string;
     streetType: string;
     streetName: string;
}

export interface UserData {
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
     status: string;
     createdAt: string;
     updatedAt: string;
     organization: UserOrganization;
     zone: UserZone;
     street: UserStreet;
}

export interface UserApiResponse {
     success: boolean;
     message: string;
     data: UserData;
}

@Injectable({
     providedIn: 'root'
})
export class UserService {
     private readonly baseUrl = environment.production
          ? 'https://lab.vallegrande.edu.pe/jass'
          : 'https://lab.vallegrande.edu.pe/jass';

     constructor(private http: HttpClient) { }

     /**
      * Obtener información completa de un usuario por ID
      */
     getUserById(userId: string): Observable<UserData> {
          const url = `${this.baseUrl}/ms-users/internal/users/${userId}`;
          const headers = this.getHeaders();

          console.log('🔍 Solicitando datos de usuario:', { userId, url });

          return this.http.get<UserApiResponse>(url, { headers }).pipe(
               map(response => {
                    console.log('✅ Respuesta del API de usuarios:', response);

                    if (response.success && response.data) {
                         return response.data;
                    } else {
                         throw new Error(`Error en la respuesta del API: ${response.message}`);
                    }
               }),
               catchError(error => {
                    console.error('❌ Error al obtener datos de usuario:', error);
                    return throwError(() => new Error(`Error al cargar información del usuario: ${error.message || 'Error desconocido'}`));
               })
          );
     }

     /**
      * Obtener solo información básica del usuario (sin organización, zona, calle)
      */
     getUserBasicInfo(userId: string): Observable<Partial<UserData>> {
          return this.getUserById(userId).pipe(
               map(userData => ({
                    id: userData.id,
                    userCode: userData.userCode,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    phone: userData.phone,
                    address: userData.address,
                    status: userData.status,
                    roles: userData.roles
               }))
          );
     }

     /**
      * Obtener información de organización del usuario
      */
     getUserOrganization(userId: string): Observable<UserOrganization> {
          return this.getUserById(userId).pipe(
               map(userData => userData.organization)
          );
     }

     /**
      * Obtener el nombre completo del usuario
      */
     getUserFullName(userId: string): Observable<string> {
          return this.getUserById(userId).pipe(
               map(userData => `${userData.firstName} ${userData.lastName}`.trim())
          );
     }

     /**
      * Generar headers con autenticación si está disponible
      */
     private getHeaders(): HttpHeaders {
          let headers = new HttpHeaders({
               'Content-Type': 'application/json',
               'Accept': 'application/json'
          });

          // Intentar obtener el token de autenticación
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          if (token) {
               headers = headers.set('Authorization', `Bearer ${token}`);
          }

          return headers;
     }
}
