import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { GatewayApiService } from './gateway-api.service';

export interface UserCompleteInfo {
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
     organization: {
          organizationCode: string;
          organizationName: string;
          legalRepresentative: string;
          phone: string;
          address: string;
          status: string;
          organizationId: string;
     };
     zone: {
          zoneCode: string;
          description: string;
          zoneName: string;
          status: string;
          zoneId: string;
     };
     street: {
          streetName: string;
          streetType: string;
          streetId: string;
          streetCode: string;
          status: string;
     };
}

@Injectable({
     providedIn: 'root'
})
export class CurrentUserService {
     private currentUserSubject = new BehaviorSubject<UserCompleteInfo | null>(null);
     public currentUser$ = this.currentUserSubject.asObservable();

     constructor(private gatewayApi: GatewayApiService) { }

     /**
      * Obtiene la información completa del usuario actual
      */
     getCurrentUserInfo(userId: string): Observable<UserCompleteInfo> {
          return this.gatewayApi.getUserById<UserCompleteInfo>(userId).pipe(
               tap(userInfo => {
                    this.currentUserSubject.next(userInfo);
                    // También almacenar en localStorage para persistencia
                    localStorage.setItem('currentUserComplete', JSON.stringify(userInfo));
               })
          );
     }

     /**
      * Obtiene la información del usuario desde el localStorage
      */
     getCurrentUserFromStorage(): UserCompleteInfo | null {
          const stored = localStorage.getItem('currentUserComplete');
          if (stored) {
               const userInfo = JSON.parse(stored);
               this.currentUserSubject.next(userInfo);
               return userInfo;
          }
          return null;
     }

     /**
      * Obtiene solo la información de la organización
      */
     getOrganizationInfo(): Observable<UserCompleteInfo['organization'] | null> {
          return this.currentUser$.pipe(
               map(user => user?.organization || null)
          );
     }

     /**
      * Obtiene solo la información de la zona
      */
     getZoneInfo(): Observable<UserCompleteInfo['zone'] | null> {
          return this.currentUser$.pipe(
               map(user => user?.zone || null)
          );
     }

     /**
      * Obtiene solo la información de la calle
      */
     getStreetInfo(): Observable<UserCompleteInfo['street'] | null> {
          return this.currentUser$.pipe(
               map(user => user?.street || null)
          );
     }

     /**
      * Limpia la información del usuario actual
      */
     clearCurrentUser(): void {
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUserComplete');
     }

     /**
      * Obtiene el valor actual sin observar cambios
      */
     getCurrentUserValue(): UserCompleteInfo | null {
          return this.currentUserSubject.value;
     }
}
