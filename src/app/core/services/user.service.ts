import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { UserGatewayService } from './user-gateway.service';
import { AuthService } from './auth.service';
import { OrganizationResolverService } from './organization-resolver.service';
import {
     UserResponseDTO,
     UserCreateDTO,
     UserUpdateDTO,
     UserFilterDTO,
     UserListResponse,
     UserWithLocationNames,
     RolesUsers,
     StatusUsers
} from '../models/user.model';

@Injectable({
     providedIn: 'root'
})
export class UserService {

     constructor(
          private userGatewayService: UserGatewayService,
          private authService: AuthService,
          private organizationResolver: OrganizationResolverService
     ) { }

     /**
      * Crear nuevo usuario
      */
     createUser(userData: UserCreateDTO): Observable<UserResponseDTO> {
          return this.userGatewayService.createClient(userData);
     }

     /**
      * Obtener todos los usuarios de la organización actual
      */
     getAllUsers(): Observable<UserResponseDTO[]> {
          const organizationId = this.authService.getCurrentOrganizationId();
          if (!organizationId) {
               throw new Error('No se encontró ID de organización');
          }

          return this.userGatewayService.getOrganizationUsers(organizationId);
     }

     /**
      * Obtener usuario por ID
      */
     getUserById(userId: string): Observable<UserResponseDTO> {
          return this.userGatewayService.getUserById(userId);
     }

     /**
      * Obtener usuario por ID con nombres de ubicación resueltos
      */
     getUserByIdWithLocationNames(userId: string): Observable<UserWithLocationNames> {
          return this.getUserById(userId).pipe(
               switchMap((user: UserResponseDTO) => {
                    return this.organizationResolver.resolveUserLocationData(
                         user.organizationId,
                         user.zoneId,
                         user.streetId
                    ).pipe(
                         map(resolvedData => ({
                              ...user,
                              organizationName: resolvedData.organizationName,
                              zoneName: resolvedData.zoneName,
                              streetName: resolvedData.streetName
                         } as UserWithLocationNames))
                    );
               })
          );
     }

     /**
      * Obtener todos los usuarios de la organización con nombres resueltos
      */
     getAllUsersWithLocationNames(): Observable<UserWithLocationNames[]> {
          return this.getAllUsers().pipe(
               switchMap((users: UserResponseDTO[]) => {
                    if (users.length === 0) {
                         return of([]);
                    }

                    const userObservables = users.map(user =>
                         this.organizationResolver.resolveUserLocationData(
                              user.organizationId,
                              user.zoneId,
                              user.streetId
                         ).pipe(
                              map(resolvedData => ({
                                   ...user,
                                   organizationName: resolvedData.organizationName,
                                   zoneName: resolvedData.zoneName,
                                   streetName: resolvedData.streetName
                              } as UserWithLocationNames))
                         )
                    );

                    return forkJoin(userObservables);
               })
          );
     }     /**
      * Obtener usuario por email (filtrado local)
      */
     getUserByEmail(email: string): Observable<UserResponseDTO | null> {
          return this.getUsersByOrganization().pipe(
               map((users: UserResponseDTO[]) =>
                    users.find((user: UserResponseDTO) => user.email === email) || null
               )
          );
     }

     /**
      * Obtener usuario por documento (filtrado local)
      */
     getUserByDocument(documentNumber: string): Observable<UserResponseDTO | null> {
          return this.getUsersByOrganization().pipe(
               map((users: UserResponseDTO[]) =>
                    users.find((user: UserResponseDTO) => user.documentNumber === documentNumber) || null
               )
          );
     }/**
      * Obtener todos los usuarios de la organización actual
      */
     getUsersByOrganization(): Observable<UserResponseDTO[]> {
          const organizationId = this.authService.getCurrentOrganizationId();
          if (!organizationId) {
               throw new Error('No se encontró ID de organización');
          }

          return this.userGatewayService.getOrganizationUsers(organizationId);
     }     /**
      * Obtener usuarios por rol de la organización actual (filtrado local)
      */
     getUsersByRole(role: RolesUsers): Observable<UserResponseDTO[]> {
          return this.getUsersByOrganization().pipe(
               map((users: UserResponseDTO[]) => users.filter((user: UserResponseDTO) => user.roles.includes(role)))
          );
     }

     /**
      * Obtener usuarios por estado de la organización actual (filtrado local)
      */
     getUsersByStatus(status: StatusUsers): Observable<UserResponseDTO[]> {
          return this.getUsersByOrganization().pipe(
               map((users: UserResponseDTO[]) => users.filter((user: UserResponseDTO) => user.status === status))
          );
     }     /**
      * Actualizar usuario completamente
      */
     updateUser(userId: string, userData: UserUpdateDTO): Observable<UserResponseDTO> {
          return this.userGatewayService.updateClient(userId, userData);
     }

     /**
      * Actualizar usuario parcialmente
      */
     updateUserPartial(userId: string, userData: UserUpdateDTO): Observable<UserResponseDTO> {
          return this.userGatewayService.updateClient(userId, userData);
     }

     /**
      * Eliminar usuario
      */
     deleteUser(userId: string): Observable<any> {
          return this.userGatewayService.deleteClient(userId);
     }

     /**
      * Restaurar usuario
      */
     restoreUser(userId: string): Observable<UserResponseDTO> {
          return this.userGatewayService.restoreClient(userId);
     }     /**
      * Verificar si email existe (filtrado local)
      */
     checkEmailExists(email: string): Observable<{ exists: boolean }> {
          return this.getUsersByOrganization().pipe(
               map((users: UserResponseDTO[]) => ({
                    exists: users.some((user: UserResponseDTO) => user.email === email)
               }))
          );
     }

     /**
      * Verificar si documento existe (filtrado local)
      */
     checkDocumentExists(documentNumber: string): Observable<{ exists: boolean }> {
          return this.getUsersByOrganization().pipe(
               map((users: UserResponseDTO[]) => ({
                    exists: users.some((user: UserResponseDTO) => user.documentNumber === documentNumber)
               }))
          );
     }

     /**
      * Obtener usuarios con water boxes de la organización actual
      * TODO: Migrar a gateway cuando esté disponible
      */
     getUsersWithWaterBoxes(): Observable<UserResponseDTO[]> {
          // Temporalmente devolver lista vacía hasta que se implemente en el gateway
          return of([]);

          // const organizationId = this.authService.getCurrentOrganizationId();
          // if (!organizationId) {
          //      throw new Error('No se encontró ID de organización');
          // }
          // const params = new HttpParams().set('organizationId', organizationId);
          // return this.apiService.get<UserResponseDTO[]>('/users/water-boxes', params);
     }

     /**
      * Obtener usuario con water boxes por ID
      * TODO: Migrar a gateway cuando esté disponible
      */
     getUserWithWaterBoxes(userId: string): Observable<UserResponseDTO> {
          // Temporalmente usar getUserById
          return this.getUserById(userId);

          // return this.apiService.get<UserResponseDTO>(`/users/${userId}/water-boxes`);
     }

     /**
      * Obtener usuarios administrativos de la organización actual
      */
     getAdminUsers(): Observable<UserResponseDTO[]> {
          return this.getUsersByRole(RolesUsers.ADMIN);
     }

     /**
      * Obtener usuarios clientes de la organización actual
      */
     getClientUsers(): Observable<UserResponseDTO[]> {
          return this.getUsersByRole(RolesUsers.CLIENT);
     }     /**
      * Obtener usuarios clientes con filtros y paginación (filtrado local)
      */
     getClientUsersWithFilters(filters: UserFilterDTO): Observable<UserListResponse> {
          return this.getUsersByOrganization().pipe(
               map((users: UserResponseDTO[]) => {
                    let filteredUsers = users.filter((user: UserResponseDTO) =>
                         user.roles.includes(RolesUsers.CLIENT)
                    );

                    if (filters.search) {
                         const searchTerm = filters.search.toLowerCase();
                         filteredUsers = filteredUsers.filter((user: UserResponseDTO) =>
                              user.fullName.toLowerCase().includes(searchTerm) ||
                              user.documentNumber.includes(searchTerm) ||
                              user.email.toLowerCase().includes(searchTerm) ||
                              user.phone.includes(searchTerm)
                         );
                    }
                    if (filters.status) {
                         filteredUsers = filteredUsers.filter((user: UserResponseDTO) =>
                              user.status === filters.status
                         );
                    }

                    if (filters.documentType) {
                         filteredUsers = filteredUsers.filter((user: UserResponseDTO) =>
                              user.documentType === filters.documentType
                         );
                    }

                    if (filters.sortBy) {
                         filteredUsers.sort((a: UserResponseDTO, b: UserResponseDTO) => {
                              let aValue = '';
                              let bValue = '';

                              switch (filters.sortBy) {
                                   case 'fullName':
                                        aValue = a.fullName;
                                        bValue = b.fullName;
                                        break;
                                   case 'documentNumber':
                                        aValue = a.documentNumber;
                                        bValue = b.documentNumber;
                                        break;
                                   case 'email':
                                        aValue = a.email;
                                        bValue = b.email;
                                        break;
                                   case 'registrationDate':
                                        aValue = a.registrationDate;
                                        bValue = b.registrationDate;
                                        break;
                                   default:
                                        aValue = a.fullName;
                                        bValue = b.fullName;
                              }

                              const comparison = aValue.localeCompare(bValue);
                              return filters.sortOrder === 'desc' ? -comparison : comparison;
                         });
                    }

                    const total = filteredUsers.length;
                    const page = filters.page || 10;
                    const limit = filters.limit || 10;
                    const totalPages = Math.ceil(total / limit);
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

                    return {
                         users: paginatedUsers,
                         total: total,
                         page: page,
                         limit: limit,
                         totalPages: totalPages
                    };
               })
          );
     }/**
      * Crear usuario cliente
      */
     createClientUser(userData: UserCreateDTO): Observable<UserResponseDTO> {
          const organizationId = this.authService.getCurrentOrganizationId();
          if (!organizationId) {
               throw new Error('No se encontró ID de organización');
          }

          const clientData = {
               ...userData,
               roles: [RolesUsers.CLIENT],
               organizationId: organizationId
          };
          return this.createUser(clientData);
     }

     /**
      * Actualizar usuario cliente
      */
     updateClientUser(userId: string, userData: UserUpdateDTO): Observable<UserResponseDTO> {
          return this.updateUser(userId, userData);
     }

     /**
      * Obtener usuarios activos de la organización actual
      */
     getActiveUsers(): Observable<UserResponseDTO[]> {
          return this.getUsersByStatus(StatusUsers.ACTIVE);
     }
}
