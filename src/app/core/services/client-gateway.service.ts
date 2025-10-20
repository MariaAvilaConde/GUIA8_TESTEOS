import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GatewayApiService } from './gateway-api.service';

export interface Organization {
     organizationId: string;
     organizationCode: string;
     organizationName: string;
     legalRepresentative: string;
     address: string;
     phone: string;
     status: string;
}

export interface Zone {
     zoneId: string;
     zoneCode: string;
     zoneName: string;
     description: string;
     status: string;
}

export interface Street {
     streetId: string;
     streetCode: string;
     streetName: string;
     streetType: string;
     status: string;
}

export interface ClientGateway {
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
     status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
     createdAt: string;
     updatedAt: string;
     organization: Organization;
     zone: Zone;
     street: Street;
}

export interface ClientApiResponse {
     success: boolean;
     message: string;
     data: ClientGateway[];
}

export interface ClientCreateRequest {
     clientCode: string;
     clientName: string;
     ruc?: string;
     address: string;
     phone: string;
     email: string;
     organizationId: string;
}

export interface ClientUpdateRequest {
     clientCode?: string;
     clientName?: string;
     ruc?: string;
     address?: string;
     phone?: string;
     email?: string;
     status?: string;
}

@Injectable({
     providedIn: 'root'
})
export class ClientGatewayService {

     constructor(private gatewayApi: GatewayApiService) { }

     /**
      * Obtener todos los clientes (Admin)
      */
     getAllClients(organizationId: string = '6896b2ecf3e398570ffd99d3'): Observable<ClientGateway[]> {
          return this.gatewayApi.getAdmin<ClientGateway[]>(`/clients/all?organizationId=${organizationId}`)
               .pipe(
                    map((response: ClientGateway[]) => {
                         console.log('Full API Response:', response); // Debug log
                         console.log('Response type:', typeof response);
                         console.log('Is array:', Array.isArray(response));

                         if (Array.isArray(response)) {
                              console.log('Returning array with length:', response.length);
                              return response;
                         }
                         console.warn('Invalid response format - expected array:', response);
                         return [];
                    })
               );
     }

     /**
      * Obtener cliente por ID (Admin)
      */
     getClientById(clientId: string): Observable<ClientGateway> {
          return this.gatewayApi.getAdmin<ClientGateway>(`/clients/${clientId}`);
     }

     /**
      * Crear nuevo cliente (Admin)
      */
     createClient(clientData: ClientCreateRequest): Observable<ClientGateway> {
          return this.gatewayApi.postAdmin<ClientGateway>('/clients', clientData);
     }

     /**
      * Actualizar cliente (Admin)
      */
     updateClient(clientId: string, clientData: ClientUpdateRequest): Observable<ClientGateway> {
          return this.gatewayApi.patchAdmin<ClientGateway>(`/clients/${clientId}`, clientData);
     }

     /**
      * Actualizar cliente completo (Admin)
      */
     replaceClient(clientId: string, clientData: ClientCreateRequest): Observable<ClientGateway> {
          return this.gatewayApi.putAdmin<ClientGateway>(`/clients/${clientId}`, clientData);
     }

     /**
      * Eliminar cliente (Admin)
      */
     deleteClient(clientId: string): Observable<void> {
          return this.gatewayApi.deleteAdmin<void>(`/clients/${clientId}`);
     }

     /**
      * Restaurar cliente (Admin)
      */
     restoreClient(clientId: string): Observable<ClientGateway> {
          return this.gatewayApi.putAdmin<ClientGateway>(`/clients/${clientId}/restore`, {});
     }

     /**
      * Obtener clientes por organización (Admin)
      */
     getClientsByOrganization(organizationId: string): Observable<ClientGateway[]> {
          return this.gatewayApi.getAdmin<ClientGateway[]>(`/clients?organizationId=${organizationId}`);
     }

     /**
      * Buscar clientes por criterios (Admin)
      */
     searchClients(searchParams: {
          clientName?: string;
          clientCode?: string;
          ruc?: string;
          status?: string;
          organizationId?: string;
     }): Observable<ClientGateway[]> {
          const params = new URLSearchParams();
          Object.entries(searchParams).forEach(([key, value]) => {
               if (value) params.append(key, value);
          });

          const queryString = params.toString();
          const endpoint = queryString ? `/clients/search?${queryString}` : '/clients/search';

          return this.gatewayApi.getAdmin<ClientGateway[]>(endpoint);
     }

     /**
      * Cambiar estado del cliente (Admin)
      */
     changeClientStatus(clientId: string, status: string): Observable<ClientGateway> {
          return this.gatewayApi.patchAdmin<ClientGateway>(`/clients/${clientId}`, { status });
     }
}
