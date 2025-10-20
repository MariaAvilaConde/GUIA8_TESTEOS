import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DistributionService } from '../../../services/distribution.service';
import { OrganizationService } from '../../../../../core/services/organization.service';
import { UserService } from '../../../../../core/services/user.service';
import { AdminsService } from '../../../../water-distribution/services/admins.service';
import { AdminData, AdminResponse } from '../../../../water-distribution/services/admins.service';
import { routes, Status } from '../../../../../core/models/distribution.model';
import { organization, zones } from '../../../../../core/models/organization.model';
import { UserResponseDTO } from '../../../../../core/models/user.model';
import { DocumentType } from '../../../../../core/models/user.model';
import Swal from 'sweetalert2';

@Component({
  standalone: true,
  selector: 'app-routes-list',
  templateUrl: './routes-list.component.html',
  styleUrl: './routes-list.component.css',
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class RoutesListComponent implements OnInit {
  private router = inject(Router);
  private routesService = inject(DistributionService);
  private organizationService = inject(OrganizationService);
  private userService = inject(UserService);
  private adminsService = inject(AdminsService);

  allRoutes: routes[] = [];
  filteredRoutes: routes[] = [];
  users: UserResponseDTO[] = [];
  organizations: organization[] = [];
  zones: zones[] = [];

  // 🔹 Filtros
  searchTerm: string = '';
  selectedStatus: 'activo' | 'inactivo' = 'activo';

  // 🔹 Alertas
  showAlert: boolean = false;
  alertType: 'success' | 'error' | 'info' = 'success';
  alertMessage: string = '';
  loading: boolean = false;

  ngOnInit() {
    this.loadRoutes();
    this.loadOrganizations();
    this.loadUsers();
  }

  loadRoutes() {
    this.loading = true;
    this.routesService.getAllR().subscribe({
      next: (routes: routes[]) => {
        // Mapear los campos de MongoDB a los campos del frontend para compatibilidad
        this.allRoutes = routes.map(route => ({
          ...route,
          organizationId: route.organization_id || route.organizationId || '',
          routeCode: route.route_code || route.routeCode || '',
          routeName: route.route_name || route.routeName || '',
          totalEstimatedDuration: route.total_estimated_duration || route.totalEstimatedDuration || 0,
          responsibleUserId: route.responsible_user_id || route.responsibleUserId || ''
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar rutas:', err);
        this.showErrorAlert('Error al cargar las rutas.');
        this.loading = false;
      }
    });
  }

  loadOrganizations() {
    this.organizationService.getAllOrganization().subscribe({
      next: (data) => {
        this.organizations = data.filter(org => org.status === 'ACTIVE');
      },
      error: (err) => {
        console.error('Error al cargar organizaciones:', err);
      }
    });
  }

  loadUsers() {
    // Obtener organizationId del contexto de autenticación
    const organizationId = localStorage.getItem('organizationId');
    if (!organizationId) {
      console.error('No se encontró organizationId en localStorage');
      return;
    }

    console.log('🔍 Cargando usuarios con AdminsService para organizationId:', organizationId);

    this.adminsService.getOrganizationAdmins(organizationId).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta de AdminsService recibida:', response);

        // Convertir AdminData a UserResponseDTO basado en la estructura real de la API
        this.users = response.map((admin: any) => ({
          id: admin.id,
          userCode: admin.userCode || '',
          firstName: admin.firstName,
          lastName: admin.lastName,
          organizationId: admin.organization?.organizationId || organizationId,
          fullName: `${admin.firstName} ${admin.lastName}`,
          streetAddress: admin.address || '',
          streetId: admin.street?.streetId || '',
          zoneId: admin.zone?.zoneId || '',
          status: admin.status || 'ACTIVE',
          registrationDate: admin.createdAt || new Date().toISOString(),
          lastLogin: admin.updatedAt || new Date().toISOString(),
          createdAt: admin.createdAt || new Date().toISOString(),
          updatedAt: admin.updatedAt || new Date().toISOString(),
          roles: admin.roles || ['ADMIN'],
          username: admin.email || '',
          // Campos adicionales para compatibilidad
          email: admin.email || '',
          documentType: (admin.documentType === 'DNI' ? DocumentType.DNI : DocumentType.CARNET_EXTRANJERIA) || DocumentType.DNI,
          documentNumber: admin.documentNumber || '',
          phone: admin.phone || ''
        })); console.log('✅ Usuarios convertidos exitosamente:', this.users.length, 'usuarios');
      },
      error: (err: any) => {
        console.error('❌ Error al cargar usuarios con AdminsService:', err);
      }
    });
  }  // 🔹 Contadores
  getActiveRCount(): number {
    return this.allRoutes.filter(route => route.status === Status.ACTIVE).length;
  }

  getInactiveRCount(): number {
    return this.allRoutes.filter(route => route.status === Status.INACTIVE).length;
  }

  // 🔹 Filtros
  onSearch() {
    this.applyFilters();
  }

  onStatusChange() {
    this.applyFilters();
  }

  private applyFilters() {
    this.filteredRoutes = this.allRoutes.filter(route => {
      const routeName = route.routeName || route.route_name || '';
      const routeCode = route.routeCode || route.route_code || '';
      const searchTerm = this.searchTerm.toLowerCase();

      const matchesSearch = routeName.toLowerCase().includes(searchTerm) ||
        routeCode.toLowerCase().includes(searchTerm);
      const isActive = route.status === Status.ACTIVE;
      const isInactive = route.status === Status.INACTIVE;
      const matchesStatus = this.selectedStatus === 'activo' ? isActive : isInactive;
      return matchesSearch && matchesStatus;
    });
  }

  // 🔹 Acciones
  addNewRoute(): void {
    console.log('🚀 Navegando a nueva ruta');
    this.router.navigate(['/admin/distribution/routes/new']).then(success => {
      if (!success) {
        console.error('❌ Error en navegación a nueva ruta');
        this.showErrorAlert('Error al navegar a nueva ruta');
      }
    }).catch(err => {
      console.error('❌ Error en navegación:', err);
      this.showErrorAlert('Error al navegar a nueva ruta');
    });
  }

  editRoute(routeId: string): void {
    console.log('✏️ Editando ruta con ID:', routeId);
    if (!routeId) {
      this.showErrorAlert('ID de ruta no válido');
      return;
    }

    this.router.navigate(['/admin/distribution/routes/edit', routeId]).then(success => {
      if (!success) {
        console.error('❌ Error en navegación a editar ruta');
        this.showErrorAlert('Error al navegar a editar ruta');
      }
    }).catch(err => {
      console.error('❌ Error en navegación:', err);
      this.showErrorAlert('Error al navegar a editar ruta');
    });
  }

  deactivateRoute(route: routes): void {
    const routeName = route.routeName || route.route_name || 'Ruta';
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas desactivar la ruta "${routeName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.routesService.deactivateRoutes(route.id).subscribe({
          next: () => {
            this.showSuccessAlert('Ruta desactivada exitosamente');
            this.loadRoutes();
          },
          error: (err: any) => {
            console.error('Error al desactivar ruta', err);
            this.showErrorAlert('Error al desactivar la ruta');
          }
        });
      }
    });
  }

  activateRoute(route: routes): void {
    const routeName = route.routeName || route.route_name || 'Ruta';
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas activar la ruta "${routeName}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, activar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.routesService.activateRoutes(route.id).subscribe({
          next: () => {
            this.showSuccessAlert('Ruta activada exitosamente');
            this.loadRoutes();
          },
          error: (err: any) => {
            console.error('Error al activar ruta', err);
            this.showErrorAlert('Error al activar la ruta');
          }
        });
      }
    });
  }

  // 🔹 Funcionalidad de PDF
  downloadPDF(route: routes): void {
    const routeCode = route.routeCode || route.route_code || 'Ruta';
    console.log('📄 Generando PDF para ruta:', routeCode);

    try {
      const pdfContent = this.generatePDFContent(route);
      this.generatePDFSimple(pdfContent);
    } catch (error) {
      console.error('❌ Error en la generación del PDF:', error);
      Swal.fire('Error', 'Error al generar el PDF. Por favor, intente nuevamente.', 'error');
    }
  }

  downloadAllPDFs(): void {
    console.log('📄 Generando PDF masivo para todas las rutas');

    try {
      const pdfContent = this.generateAllPDFsContent();
      this.generatePDFSimple(pdfContent);
    } catch (error) {
      console.error('❌ Error en la generación del PDF masivo:', error);
      Swal.fire('Error', 'Error al generar el PDF masivo. Por favor, intente nuevamente.', 'error');
    }
  }

  private generatePDFContent(route: routes): string {
    const organizationName = this.getNameOrganization(route.organizationId || route.organization_id || '');
    const responsibleName = this.getUserName(route.responsibleUserId || route.responsible_user_id || '');
    const statusText = this.getStatusLabel(route.status);
    const zonesInfo = this.getZonesInfo(route.zones);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ruta - ${route.routeCode || route.route_code || ''}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .section-title {
            background: #f3f4f6;
            padding: 10px;
            font-weight: bold;
            border-left: 4px solid #3b82f6;
            margin-bottom: 15px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .field {
            margin-bottom: 15px;
          }
          .label {
            font-weight: bold;
            color: #6b7280;
            font-size: 12px;
            text-transform: uppercase;
          }
          .value {
            font-size: 14px;
            margin-top: 5px;
          }
          .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-active { background: #d1fae5; color: #065f46; }
          .status-inactive { background: #fee2e2; color: #991b1b; }
          .zones-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .zones-table th, .zones-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .zones-table th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INFORMACIÓN DE RUTA</h1>
          <h2>${route.routeCode || route.route_code || ''}</h2>
          <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div class="section">
          <div class="section-title">INFORMACIÓN BÁSICA</div>
          <div class="grid">
            <div class="field">
              <div class="label">Código de Ruta</div>
              <div class="value">${route.routeCode || route.route_code || ''}</div>
            </div>
            <div class="field">
              <div class="label">Nombre de Ruta</div>
              <div class="value">${route.routeName || route.route_name || ''}</div>
            </div>
            <div class="field">
              <div class="label">Organización</div>
              <div class="value">${organizationName}</div>
            </div>
            <div class="field">
              <div class="label">Estado</div>
              <div class="value">
                <span class="status status-${route.status.toLowerCase()}">${statusText}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">DETALLES DE LA RUTA</div>
          <div class="grid">
            <div class="field">
              <div class="label">Responsable</div>
              <div class="value">${responsibleName}</div>
            </div>
            <div class="field">
              <div class="label">Duración Total Estimada</div>
              <div class="value">${route.totalEstimatedDuration || route.total_estimated_duration || 0} horas</div>
            </div>
            <div class="field">
              <div class="label">Número de Zonas</div>
              <div class="value">${this.getZonesCount(route.zones)} zonas</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ZONAS DE LA RUTA</div>
          <table class="zones-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Zona ID</th>
                <th>Duración Estimada</th>
              </tr>
            </thead>
            <tbody>
              ${route.zones.map(zone => `
                <tr>
                  <td>${zone.order}</td>
                  <td>${zone.zone_id || zone.zoneId || ''}</td>
                  <td>${zone.estimated_duration || zone.estimatedDuration || 0} horas</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  private generateAllPDFsContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Rutas</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .status-active { background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 12px; font-size: 11px; }
          .status-inactive { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 12px; font-size: 11px; }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REPORTE COMPLETO DE RUTAS</h1>
          <p>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</p>
          <p>Total de rutas: ${this.filteredRoutes.length}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>NOMBRE</th>
              <th>ORGANIZACIÓN</th>
              <th>ZONAS</th>
              <th>DURACIÓN TOTAL</th>
              <th>RESPONSABLE</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredRoutes.map(route => `
              <tr>
                <td>${route.routeCode || route.route_code || ''}</td>
                <td>${route.routeName || route.route_name || ''}</td>
                <td>${this.getNameOrganization(route.organizationId || route.organization_id || '')}</td>
                <td>${this.getZonesCount(route.zones)} zonas</td>
                <td>${route.totalEstimatedDuration || route.total_estimated_duration || 0}h</td>
                <td>${this.getUserName(route.responsibleUserId || route.responsible_user_id || '')}</td>
                <td><span class="status status-${route.status.toLowerCase()}">${this.getStatusLabel(route.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  private generatePDFSimple(htmlContent: string): void {
    try {
      // Crear un elemento temporal para renderizar el HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      // Usar la API de impresión del navegador
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Esperar a que se cargue el contenido
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();

          // Limpiar el elemento temporal
          document.body.removeChild(tempDiv);

          console.log('✅ PDF generado exitosamente usando impresión del navegador');
        };
      } else {
        // Fallback: usar la función de impresión del navegador
        const printContent = htmlContent;
        const printFrame = document.createElement('iframe');
        printFrame.style.display = 'none';
        printFrame.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(printContent);

        document.body.appendChild(printFrame);

        printFrame.onload = () => {
          printFrame.contentWindow?.print();

          // Limpiar después de un tiempo
          setTimeout(() => {
            document.body.removeChild(printFrame);
            document.body.removeChild(tempDiv);
          }, 1000);

          console.log('✅ PDF generado exitosamente usando iframe');
        };
      }

    } catch (error) {
      console.error('❌ Error en la generación del PDF:', error);
      Swal.fire('Error', 'Error al generar el PDF. Por favor, intente nuevamente.', 'error');
    }
  }

  // 🔹 Utilidades
  trackByRouteId(index: number, route: routes): string {
    return route.id;
  }

  getZonesCount(zones: any[]): number {
    return zones ? zones.length : 0;
  }

  getZonesInfo(zones: any[]): string {
    if (!zones || zones.length === 0) return 'Sin zonas asignadas';
    return zones.map(zone => `Zona ${zone.order} (${zone.estimated_duration || zone.estimatedDuration || 0}h)`).join(', ');
  }

  getNameOrganization(id: string): string {
    if (!this.organizations) {
      return 'Desconocido';
    }
    const org = this.organizations.find(o => o.organizationId === id);
    return org?.organizationName || 'Desconocido';
  }

  getUserName(userId: string): string {
    if (!this.users) {
      return 'Sin asignar';
    }
    const user = this.users.find(u => u.id === userId);
    return user ? user.fullName : 'Sin asignar';
  }

  // 🔹 Alertas
  dismissAlert() {
    this.showAlert = false;
  }

  showSuccessAlert(message: string) {
    this.alertType = 'success';
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  showErrorAlert(message: string) {
    this.alertType = 'error';
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  showInfoAlert(message: string) {
    this.alertType = 'info';
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }

  getStatusClass(status: Status): string {
    return status === Status.ACTIVE
      ? 'text-green-700 bg-green-100'
      : 'text-red-700 bg-red-100';
  }

  getStatusLabel(status: Status): string {
    switch (status) {
      case Status.ACTIVE: return 'Activo';
      case Status.INACTIVE: return 'Inactivo';
      default: return 'Desconocido';
    }
  }
}
