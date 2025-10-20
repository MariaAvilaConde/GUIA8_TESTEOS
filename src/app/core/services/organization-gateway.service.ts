import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GatewayApiService } from './gateway-api.service';

export interface OrganizationGateway {
  organizationCode: string;
  organizationName: string;
  legalRepresentative: string;
  phone: string;
  address: string;
  status: string;
  organizationId: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationGatewayService {

  constructor(private gatewayApi: GatewayApiService) { }

  /**
   * Obtener organización por ID a través del gateway
   */
  getOrganizationById(organizationId: string): Observable<OrganizationGateway> {
    return this.gatewayApi.getInternal<OrganizationGateway>(`/organizations/${organizationId}`);
  }

  /**
   * Obtener todas las organizaciones (para SUPER_ADMIN)
   */
  getAllOrganizations(): Observable<OrganizationGateway[]> {
    return this.gatewayApi.getManagement<OrganizationGateway[]>('/organizations');
  }

  /**
   * Crear nueva organización (para SUPER_ADMIN)
   */
  createOrganization(organizationData: Partial<OrganizationGateway>): Observable<OrganizationGateway> {
    return this.gatewayApi.postManagement<OrganizationGateway>('/organizations', organizationData);
  }

  /**
   * Actualizar organización (para SUPER_ADMIN)
   */
  updateOrganization(organizationId: string, organizationData: Partial<OrganizationGateway>): Observable<OrganizationGateway> {
    return this.gatewayApi.putManagement<OrganizationGateway>(`/organizations/${organizationId}`, organizationData);
  }

  /**
   * Obtener usuarios de una organización específica (a través del internal path)
   */
  getOrganizationUsers(organizationId: string): Observable<any[]> {
    return this.gatewayApi.getInternal<any[]>(`/organizations/${organizationId}/users`);
  }

  /**
   * Obtener estadísticas de usuarios de una organización
   */
  getOrganizationUserStats(organizationId: string): Observable<any> {
    return this.gatewayApi.getInternal<any>(`/organizations/${organizationId}/user-stats`);
  }
}
