import { StatusUsers, RolesUsers, DocumentType } from '../../../core/models/user.model';

// ==================== INTERFACES PARA ADMIN CLIENT SERVICE ====================

/**
 * Respuesta del servicio de administración de clientes
 */
export interface AdminClientResponse {
     success: boolean;
     message: string;
     data: any;
}

/**
 * Cliente con información de ubicación completa
 */
export interface UserWithLocationResponse {
     id: string;
     userCode: string;
     firstName: string;
     lastName: string;
     documentType: DocumentType;
     documentNumber: string;
     email: string;
     phone: string;
     address: string;
     roles: RolesUsers[];
     status: StatusUsers;
     createdAt: string;
     updatedAt: string;
     organization: OrganizationInfo | null;
     zone: ZoneInfo | null;
     street: StreetInfo | null;
}

/**
 * Información de organización
 */
export interface OrganizationInfo {
     organizationId: string;
     organizationCode: string;
     organizationName: string;
     legalRepresentative: string;
     address: string;
     phone: string;
     status: string;
}

/**
 * Información de zona
 */
export interface ZoneInfo {
     zoneId: string;
     zoneCode: string;
     zoneName: string;
     description: string;
     status: string;
}

/**
 * Información de calle
 */
export interface StreetInfo {
     streetId: string;
     streetCode: string;
     streetName: string;
     streetType: string;
     status: string;
}

/**
 * Request para crear cliente
 */
export interface CreateUserRequest {
     documentType: DocumentType; // Agregar documentType como requiere el backend
     documentNumber: string;
     organizationId: string;
     email?: string;
     phone?: string;
     address?: string;
     zoneId?: string;
     streetId?: string;
     roles?: RolesUsers[]; // Cambio: usar array en lugar de Set para serialización JSON
     firstName?: string;
     lastName?: string;
}

/**
 * Request para actualización parcial
 */
export interface UpdateUserPatchRequest {
     email?: string;
     phone?: string;
     address?: string;
     zoneId?: string;
     streetId?: string;
     firstName?: string;
     lastName?: string;
}

/**
 * Respuesta de creación de usuario
 */
export interface UserCreationResponse {
     userInfo: UserWithLocationResponse;
     username: string;
     temporaryPassword: string;
}

/**
 * Respuesta paginada para listado de clientes
 */
export interface PagedClientResponse {
     content: UserWithLocationResponse[];
     totalElements: number;
     totalPages: number;
     number: number;
     size: number;
     first: boolean;
     last: boolean;
     empty: boolean;
}

/**
 * Filtros para listado de clientes
 */
export interface ClientFilters {
     page?: number;
     size?: number;
     search?: string;
     status?: StatusUsers;
     organizationId?: string;
}

/**
 * Respuesta de código de usuario
 */
export interface UserCodeResponse {
     userCode: string;
}
