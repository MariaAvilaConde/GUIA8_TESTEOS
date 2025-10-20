import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GatewayApiService } from './gateway-api.service';
import { UserResponseDTO, RolesUsers } from '../models/user.model';

@Injectable({
     providedIn: 'root'
})
export class UserGatewayService {

     constructor(private gatewayApiService: GatewayApiService) { }

     // ==================== MANAGEMENT ROUTES (SUPER_ADMIN) ====================

     /**
      * Crear administrador (SUPER_ADMIN)
      */
     createAdmin(adminData: any): Observable<UserResponseDTO> {
          return this.gatewayApiService.postManagement<UserResponseDTO>('/admins', adminData);
     }

     /**
      * Listar administradores (SUPER_ADMIN)
      */
     getAdmins(): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getManagement<UserResponseDTO[]>('/admins');
     }

     /**
      * Obtener administradores activos (SUPER_ADMIN)
      */
     getActiveAdmins(): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getManagement<UserResponseDTO[]>('/admins/active');
     }

     /**
      * Obtener administradores inactivos (SUPER_ADMIN)
      */
     getInactiveAdmins(): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getManagement<UserResponseDTO[]>('/admins/inactive');
     }

     /**
      * Eliminar administrador permanentemente (SUPER_ADMIN)
      */
     deleteAdminPermanent(adminId: string): Observable<any> {
          return this.gatewayApiService.deleteManagement<any>(`/admins/${adminId}/permanent`);
     }

     /**
      * Restaurar administrador (SUPER_ADMIN)
      */
     restoreAdmin(adminId: string): Observable<UserResponseDTO> {
          return this.gatewayApiService.patchManagement<UserResponseDTO>(`/admins/${adminId}/restore`, {});
     }

     /**
      * Cambiar estado de usuario (SUPER_ADMIN)
      */
     changeUserStatus(userId: string, status: boolean): Observable<any> {
          return this.gatewayApiService.patchManagement<any>(`/users/${userId}/status`, { active: status });
     }

     /**
      * Eliminar usuario (SUPER_ADMIN)
      */
     deleteUser(userId: string): Observable<any> {
          return this.gatewayApiService.deleteManagement<any>(`/users/${userId}`);
     }

     /**
      * Resetear código de usuario (SUPER_ADMIN)
      */
     resetUserCode(userId: string): Observable<any> {
          return this.gatewayApiService.postManagement<any>(`/user-codes/reset/${userId}`, {});
     }

     /**
      * Obtener estadísticas del sistema (SUPER_ADMIN)
      */
     getSystemStats(): Observable<any> {
          return this.gatewayApiService.getManagement<any>('/stats');
     }

     // ==================== ADMIN ROUTES (ADMIN) ====================

     /**
      * Crear cliente (ADMIN)
      */
     createClient(clientData: any): Observable<UserResponseDTO> {
          return this.gatewayApiService.postAdmin<UserResponseDTO>('/clients', clientData);
     }

     /**
      * Listar clientes (ADMIN)
      */
     getClients(): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getAdmin<UserResponseDTO[]>('/clients');
     }

     /**
      * Obtener cliente por ID (ADMIN)
      */
     getClientById(clientId: string): Observable<UserResponseDTO> {
          return this.gatewayApiService.getAdmin<UserResponseDTO>(`/clients/${clientId}`);
     }

     /**
      * Actualizar cliente (ADMIN)
      */
     updateClient(clientId: string, clientData: any): Observable<UserResponseDTO> {
          return this.gatewayApiService.patchAdmin<UserResponseDTO>(`/clients/${clientId}`, clientData);
     }

     /**
      * Eliminar cliente (ADMIN)
      */
     deleteClient(clientId: string): Observable<any> {
          return this.gatewayApiService.deleteAdmin<any>(`/clients/${clientId}`);
     }

     /**
      * Cambiar estado de cliente (ADMIN)
      */
     changeClientStatus(clientId: string, status: boolean): Observable<any> {
          return this.gatewayApiService.patchAdmin<any>(`/clients/${clientId}/status`, { active: status });
     }

     /**
      * Restaurar cliente (ADMIN)
      */
     restoreClient(clientId: string): Observable<UserResponseDTO> {
          return this.gatewayApiService.patchAdmin<UserResponseDTO>(`/clients/${clientId}/restore`, {});
     }

     /**
      * Obtener clientes activos (ADMIN)
      */
     getActiveClients(): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getAdmin<UserResponseDTO[]>('/clients/active');
     }

     /**
      * Obtener clientes inactivos (ADMIN)
      */
     getInactiveClients(): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getAdmin<UserResponseDTO[]>('/clients/inactive');
     }

     /**
      * Obtener todos los clientes (ADMIN)
      */
     getAllClients(): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getAdmin<UserResponseDTO[]>('/clients/all');
     }

     /**
      * Generar código de usuario (ADMIN)
      */
     generateUserCode(): Observable<{ userCode: string }> {
          return this.gatewayApiService.postAdmin<{ userCode: string }>('/user-codes/generate', {});
     }

     /**
      * Obtener siguiente código de usuario (ADMIN)
      */
     getNextUserCode(): Observable<{ userCode: string }> {
          return this.gatewayApiService.getAdmin<{ userCode: string }>('/user-codes/next');
     }

     // ==================== CLIENT ROUTES (CLIENT) ====================

     /**
      * Obtener perfil del cliente actual (CLIENT)
      */
     getClientProfile(): Observable<UserResponseDTO> {
          return this.gatewayApiService.getClient<UserResponseDTO>('/profile');
     }

     /**
      * Actualizar perfil del cliente (CLIENT)
      */
     updateClientProfile(profileData: any): Observable<UserResponseDTO> {
          return this.gatewayApiService.putClient<UserResponseDTO>('/profile', profileData);
     }

     /**
      * Obtener perfil por código de usuario (CLIENT)
      */
     getProfileByCode(userCode: string): Observable<UserResponseDTO> {
          return this.gatewayApiService.getClient<UserResponseDTO>(`/profile/code/${userCode}`);
     }

     /**
      * Obtener estado del perfil (CLIENT)
      */
     getProfileStatus(): Observable<any> {
          return this.gatewayApiService.getClient<any>('/profile/status');
     }

     /**
      * Obtener código de usuario del cliente (CLIENT)
      */
     getClientUserCode(): Observable<{ userCode: string }> {
          return this.gatewayApiService.getClient<{ userCode: string }>('/user-code');
     }

     // ==================== COMMON ROUTES (PÚBLICAS Y AUTENTICADAS) ====================

     /**
      * Health check
      */
     healthCheck(): Observable<any> {
          return this.gatewayApiService.getCommon<any>('/health');
     }

     /**
      * Ping
      */
     ping(): Observable<any> {
          return this.gatewayApiService.getCommon<any>('/ping');
     }

     /**
      * Obtener roles disponibles
      */
     getRoles(): Observable<RolesUsers[]> {
          return this.gatewayApiService.getCommon<RolesUsers[]>('/roles');
     }

     /**
      * Obtener información básica de usuario por código
      */
     getUserBasicInfoByCode(userCode: string): Observable<any> {
          return this.gatewayApiService.getCommon<any>(`/user/code/${userCode}/basic`);
     }

     /**
      * Verificar si usuario existe por código
      */
     checkUserExistsByCode(userCode: string): Observable<{ exists: boolean }> {
          return this.gatewayApiService.getCommon<{ exists: boolean }>(`/user/code/${userCode}/exists`);
     }

     /**
      * Verificar disponibilidad de email
      */
     checkEmailAvailability(email: string): Observable<{ available: boolean }> {
          return this.gatewayApiService.getCommon<{ available: boolean }>(`/user/email/${email}/available`);
     }

     /**
      * Obtener usuario por username
      */
     getUserByUsername(username: string): Observable<UserResponseDTO> {
          return this.gatewayApiService.getCommon<UserResponseDTO>(`/user/username/${username}`);
     }

     /**
      * Setup del primer usuario del sistema
      */
     setupFirstUser(userData: any): Observable<UserResponseDTO> {
          return this.gatewayApiService.postCommon<UserResponseDTO>('/setup/first-user', userData);
     }

     // ==================== INTERNAL ROUTES (MICROSERVICIOS) ====================

     /**
      * Obtener usuarios de una organización (INTERNAL)
      */
     getOrganizationUsers(organizationId: string): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getInternal<UserResponseDTO[]>(`/organizations/${organizationId}/users`);
     }

     /**
      * Obtener clientes de una organización (INTERNAL)
      */
     getOrganizationClients(organizationId: string): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getInternal<UserResponseDTO[]>(`/organizations/${organizationId}/clients`);
     }

     /**
      * Obtener administradores de una organización (INTERNAL)
      */
     getOrganizationAdmins(organizationId: string): Observable<UserResponseDTO[]> {
          return this.gatewayApiService.getInternal<UserResponseDTO[]>(`/organizations/${organizationId}/admins`);
     }

     /**
      * Obtener usuario por ID (INTERNAL)
      */
     getUserById(userId: string): Observable<UserResponseDTO> {
          return this.gatewayApiService.getInternal<UserResponseDTO>(`/users/${userId}`);
     }

     /**
      * Crear administrador para organización (INTERNAL)
      */
     createAdminForOrganization(organizationId: string, adminData: any): Observable<UserResponseDTO> {
          return this.gatewayApiService.postInternal<UserResponseDTO>(`/organizations/${organizationId}/create-admin`, adminData);
     }

     // ==================== LEGACY SUPPORT - COMPATIBILIDAD ====================

     /**
      * Obtener usuario actual (me) - Compatibilidad
      */
     getCurrentUser(): Observable<UserResponseDTO> {
          return this.gatewayApiService.getCommon<UserResponseDTO>('/users/me');
     }

     /**
      * Actualizar perfil - Compatibilidad
      */
     updateProfile(profileData: any): Observable<UserResponseDTO> {
          return this.gatewayApiService.putCommon<UserResponseDTO>('/users/update-profile', profileData);
     }

     /**
      * Cambiar contraseña - Compatibilidad
      */
     changePassword(passwordData: any): Observable<any> {
          return this.gatewayApiService.postCommon<any>('/users/change-password', passwordData);
     }
}
