import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GatewayApiService } from './gateway-api.service';

@Injectable({
     providedIn: 'root'
})
export class PasswordGatewayService {

     constructor(private gatewayApiService: GatewayApiService) { }

     /**
      * Cambiar contraseña del usuario autenticado
      */
     changePassword(currentPassword: string, newPassword: string): Observable<any> {
          const changePasswordData = {
               currentPassword,
               newPassword
          };
          return this.gatewayApiService.postAuth<any>('/change-password', changePasswordData);
     }

     /**
      * Cambio de contraseña por primera vez
      */
     firstPasswordChange(temporaryPassword: string, newPassword: string): Observable<any> {
          const passwordData = {
               temporaryPassword,
               newPassword
          };
          return this.gatewayApiService.postAuth<any>('/first-password-change', passwordData);
     }

     /**
      * Renovar contraseña temporal
      */
     renewTemporaryPassword(email: string): Observable<any> {
          const renewData = {
               email
          };
          return this.gatewayApiService.postAuth<any>('/renew-temporary-password', renewData);
     }

     /**
      * Validar usuario actual (me)
      */
     validateMe(): Observable<any> {
          return this.gatewayApiService.getAuth<any>('/me');
     }
}
