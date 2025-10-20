import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DistributionProgram } from '../../../../core/models/water-distribution.model';
import { DistributionService } from '../../../distribution/services/distribution.service';
import { User as ResponsibleUser, UserResponseDTO } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { AdminsService } from '../../services/admins.service';
import { organization as Organization } from '../../../../core/models/organization.model';
import { OrganizationService } from '../../../../core/services/organization.service';
import Swal from 'sweetalert2';
import { ProgramsService } from '../../services/water-distribution.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.production';
import { zones, street } from '../../../../core/models/organization.model';
import { OrganizationContextService } from 'app/core/services/organization-context.service';
import { routes as Route, schedules as Schedule } from '../../../../core/models/distribution.model';
import { AuthService } from 'app/core/services/auth.service';
import { OrganizationResolverService } from 'app/core/services/organization-resolver.service';

@Component({
  selector: 'app-program-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './program-form.component.html',
  styleUrls: ['./program-form.component.css']
})
export class ProgramFormComponent implements OnInit {
  programsForm: FormGroup;
  isEditMode = false;
  isViewMode = false;
  isSubmitting = false;
  programId: string | null = null;
  organizations: Organization[] = [];
  routes: Route[] = [];
  schedules: Schedule[] = [];
  responsible: UserResponseDTO[] = [];
  minDate: string = '';
  selectedOrganization: any = null;
  zones: any[] = [];
  streets: any[] = [];
  currentUser: any = null;
  error: string | null = null;

  loadZonesByOrganization(orgId: string) {
    console.log('🔄 Cargando zonas para organización:', orgId);
    this.organizationResolver.getZonesByOrganization(orgId).subscribe({
      next: (zones) => {
        this.zones = zones;
        console.log('📌 Zonas cargadas:', zones);
      },
      error: (err) => console.error('Error al cargar zonas', err)
    });
  }

  loadStreetsByZone(zoneId: string) {
    console.log('🔄 Cargando calles para zona:', zoneId);
    this.organizationResolver.getStreetsByZone(zoneId).subscribe({
      next: (streets) => {
        this.streets = streets;
        console.log('📌 Calles cargadas:', streets);
      },
      error: (err) => console.error('Error al cargar calles', err)
    });
  }

  loadRoutes(organizationId: string) {
    console.log('Loading routes for organization:', organizationId);
    this.distributionService.getRoutesByOrganization(organizationId).subscribe({
      next: (data: Route[]) => {
        console.log('Raw routes data from API:', data);

        // Filtrar del lado del cliente por si la API no filtra correctamente
        this.routes = data.filter(route => route.organizationId === organizationId);

        console.log('Filtered routes for organization', organizationId, ':', this.routes);
        console.log('Routes count after filtering:', this.routes.length);

        if (this.routes.length === 0) {
          console.warn('No routes found for organization:', organizationId);
        }
      },
      error: (err) => {
        console.error("❌ Error cargando rutas:", err);
        this.routes = [];
      }
    });
  }

  loadSchedules(organizationId: string) {
    this.distributionService.getSchedulesByOrganization(organizationId).subscribe({
      next: (data: Schedule[]) => {
        this.schedules = data;
        console.log('🕐 Horarios cargados para organización:', organizationId, data);

        // Si no hay horarios disponibles, mostrar advertencia
        if (data.length === 0) {
          console.warn('⚠️ No hay horarios disponibles para esta organización');
        }
      },
      error: (err) => {
        console.error("❌ Error cargando horarios:", err);
        this.schedules = [];
        // Mostrar error al usuario
        Swal.fire({
          icon: 'warning',
          title: 'Advertencia',
          text: 'No se pudieron cargar los horarios. Verifique que existan horarios configurados para su organización.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  loadResponsible(): void {
    const orgId = this.authService.getCurrentOrganizationId();
    if (!orgId) {
      console.warn('⚠️ No hay organizationId en el contexto para cargar administradores.');
      return;
    }

    console.log('🔄 Cargando administradores para organización:', orgId);

    this.adminsService.getOrganizationAdmins(orgId).subscribe({
      next: (admins) => {
        console.log('👥 Administradores obtenidos:', admins);

        // Convertir AdminData a UserResponseDTO para compatibilidad
        this.responsible = admins.map(admin => ({
          id: admin.id,
          organizationId: admin.organization,
          userCode: admin.userCode,
          documentType: admin.documentType as any,
          documentNumber: admin.documentNumber,
          firstName: admin.firstName,
          lastName: admin.lastName,
          fullName: `${admin.firstName} ${admin.lastName}`,
          email: admin.email,
          phone: admin.phone,
          streetAddress: admin.address,
          streetId: admin.street,
          zoneId: admin.zone,
          status: admin.status as any,
          registrationDate: admin.createdAt,
          lastLogin: admin.updatedAt,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
          roles: admin.roles as any,
          username: admin.email // Usar email como username fallback
        }));

        console.log('👥 Usuarios cargados:', this.responsible);
        console.log('👤 Usuario actual:', this.currentUser);

        // Si no es modo edición, establecer el usuario actual como responsable por defecto
        if (!this.isEditMode && this.currentUser) {
          console.log('✅ Estableciendo usuario actual como responsable:', this.currentUser.id);
          this.programsForm.patchValue({ responsibleUserId: this.currentUser.id });
        }
      },
      error: (err) => {
        console.error("❌ Error cargando administradores:", err);
        this.responsible = [];
      }
    });
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private programsService: ProgramsService,
    private distributionService: DistributionService,
    private userService: UserService,
    private adminsService: AdminsService,
    private organizationService: OrganizationService,
    private organizationContextService: OrganizationContextService,
    private authService: AuthService,
    private organizationResolver: OrganizationResolverService
  ) {
    this.programsForm = this.fb.group({
      programCode: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]],
      programDate: [{ value: '', disabled: true }, Validators.required],
      plannedStartTime: ['', [Validators.required, this.timeFormatValidator()]],
      plannedEndTime: ['', [Validators.required, this.timeFormatValidator()]],
      actualStartTime: ['', this.timeFormatValidator()],
      actualEndTime: ['', this.timeFormatValidator()],
      organizationId: [{ value: '', disabled: true }, Validators.required],
      routeId: ['', [Validators.required, this.routeValidator.bind(this)]],
      scheduleId: ['', Validators.required],
      zoneId: ['', Validators.required],
      streetId: ['', Validators.required],
      responsibleUserId: ['', Validators.required],
      status: ['', Validators.required],
      observations: ['', [
        Validators.maxLength(300),
        Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ][A-Za-zÁÉÍÓÚáéíóúÑñ ]*$/)
      ]]
    }, { validators: [this.timeRangeValidator.bind(this)] });
  }

  // Validador personalizado para formato de hora (HH:MM)
  private timeFormatValidator() {
    return (control: any) => {
      if (!control.value) return null;

      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(control.value)) {
        return { invalidTimeFormat: true };
      }
      return null;
    };
  }

  // Validador personalizado para horario (debe pertenecer a la organización actual)
  private scheduleValidator(control: any) {
    if (!control.value) return null;

    const currentOrgId = this.authService.getCurrentOrganizationId();
    if (!currentOrgId) return null;

    // Verificar que el horario seleccionado pertenezca a la organización actual
    const selectedSchedule = this.schedules.find(schedule => schedule.id === control.value);
    if (selectedSchedule && selectedSchedule.organizationId !== currentOrgId) {
      return { invalidScheduleOrganization: true };
    }

    return null;
  }

  // Validador personalizado para ruta (debe pertenecer a la organización actual)
  private routeValidator(control: any) {
    if (!control.value) return null;

    const currentOrgId = this.authService.getCurrentOrganizationId();
    if (!currentOrgId) return null;

    // Verificar que la ruta seleccionada pertenezca a la organización actual
    const selectedRoute = this.routes.find(route => route.id === control.value);

    // Logging para debug
    console.log('Route Validator Debug:');
    console.log('- Selected route ID:', control.value);
    console.log('- Current organization ID:', currentOrgId);
    console.log('- Selected route data:', selectedRoute);
    console.log('- Available routes count:', this.routes.length);
    console.log('- Available routes:', this.routes);

    if (selectedRoute && selectedRoute.organizationId !== currentOrgId) {
      console.log('- VALIDATION FAILED: Route organization mismatch');
      console.log('- Route organizationId:', selectedRoute.organizationId);
      console.log('- Expected organizationId:', currentOrgId);
      return { invalidRouteOrganization: true };
    }

    console.log('- VALIDATION PASSED');
    return null;
  }

  // Validador personalizado para rango de horas
  private timeRangeValidator(formGroup: FormGroup) {
    const plannedStartTime = formGroup.get('plannedStartTime')?.value;
    const plannedEndTime = formGroup.get('plannedEndTime')?.value;
    const actualStartTime = formGroup.get('actualStartTime')?.value;
    const actualEndTime = formGroup.get('actualEndTime')?.value;

    const errors: any = {};

    // Validar que la hora de fin planificada sea mayor que la de inicio
    if (plannedStartTime && plannedEndTime) {
      if (this.compareTimes(plannedStartTime, plannedEndTime) >= 0) {
        errors.invalidPlannedTimeRange = true;
      }
    }

    // Validar que la hora de fin real sea mayor que la de inicio (si ambas están presentes)
    if (actualStartTime && actualEndTime) {
      if (this.compareTimes(actualStartTime, actualEndTime) >= 0) {
        errors.invalidActualTimeRange = true;
      }
    }

    // Validar que las horas reales no sean menores que las planificadas (si están presentes)
    if (plannedStartTime && actualStartTime) {
      if (this.compareTimes(actualStartTime, plannedStartTime) < 0) {
        errors.actualStartBeforePlanned = true;
      }
    }

    if (plannedEndTime && actualEndTime) {
      if (this.compareTimes(actualEndTime, plannedEndTime) < 0) {
        errors.actualEndBeforePlanned = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  // Método auxiliar para comparar horas
  private compareTimes(time1: string, time2: string): number {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);

    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;

    return totalMinutes1 - totalMinutes2;
  }

  ngOnInit(): void {
    // Obtener el usuario actual
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Usuario actual:', this.currentUser);

    // Detectar el modo basándose en la ruta
    const url = this.router.url;
    console.log('🔗 URL actual:', url);

    if (url.includes('/edit/')) {
      this.isEditMode = true;
      this.isViewMode = false;
      this.programId = this.route.snapshot.paramMap.get('id');
      console.log('✏️ Modo EDICIÓN detectado, ID:', this.programId);
    } else if (url.includes('/view/')) {
      this.isViewMode = true;
      this.isEditMode = false;
      this.programId = this.route.snapshot.paramMap.get('id');
      console.log('👁️ Modo VISTA detectado, ID:', this.programId);
    } else {
      // Modo creación
      this.isEditMode = false;
      this.isViewMode = false;
      this.programId = null;
      console.log('➕ Modo CREACIÓN detectado');
    }

    // Establecer fecha mínima como hoy
    this.minDate = this.getTodayDate();

    if (this.programId) {
      console.log('📋 Cargando programa existente...');
      this.loadProgram(); // edición o vista
    } else {
      console.log('🆕 Cargando datos para nuevo programa...');
      this.loadInitialData(); // creación
      this.generateProgramCode();
      this.programsForm.patchValue({
        programDate: this.minDate
      });
      // Bloquear la fecha para que no se pueda editar
      this.programsForm.get('programDate')?.disable();
    }
  }



  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private generateProgramCode(): void {
    // Generar código local más robusto sin hacer llamada al backend
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    const generatedCode = `PRG${year}${month}${day}${random}`;

    this.programsForm.patchValue({ programCode: generatedCode });
    this.programsForm.get('programCode')?.setValue(generatedCode);

    console.log('✅ Código del programa generado localmente:', generatedCode);
    console.log('⚠️ Nota: Endpoint de backend no disponible, usando generación local');

    // Opcional: Intentar el backend pero no depender de él
    /*
    this.programsService.getNextProgramCode().subscribe({
      next: (response: { nextCode: string }) => {
        const backendCode = response.nextCode || generatedCode;
        this.programsForm.patchValue({ programCode: backendCode });
        this.programsForm.get('programCode')?.setValue(backendCode);
        console.log('✅ Código del programa obtenido del backend:', backendCode);
      },
      error: (error: any) => {
        console.error('❌ Error al obtener código del backend (usando generación local):', error);
        // Mantener el código generado localmente
      }
    });
    */
  }

  isFormValid(): boolean {
    const isValid = this.programsForm.valid;
    console.log('🔍 Verificando validez del formulario:', isValid);

    if (!isValid) {
      console.log('❌ Formulario inválido. Errores:');
      Object.keys(this.programsForm.controls).forEach(key => {
        const control = this.programsForm.get(key);
        if (control && control.invalid) {
          console.log(`  - ${key}:`, control.errors);
        }
      });
    }

    return isValid;
  }

  getFieldError(fieldName: string): string {
    const field = this.programsForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['invalidTimeFormat']) return 'Formato de hora inválido (use HH:MM)';
    if (field.errors['invalidScheduleOrganization']) return 'El horario seleccionado no pertenece a su organización';
    if (field.errors['invalidRouteOrganization']) return 'La ruta seleccionada no pertenece a su organización';

    return 'Campo inválido';
  }

  // Método para obtener errores del formulario completo (validaciones cruzadas)
  getFormError(): string {
    const formErrors = this.programsForm.errors;
    if (!formErrors) return '';

    if (formErrors['invalidPlannedTimeRange']) {
      return 'La hora de fin planificada debe ser mayor que la hora de inicio';
    }
    if (formErrors['invalidActualTimeRange']) {
      return 'La hora de fin real debe ser mayor que la hora de inicio';
    }
    if (formErrors['actualStartBeforePlanned']) {
      return 'La hora de inicio real no puede ser menor que la hora de inicio planificada';
    }
    if (formErrors['actualEndBeforePlanned']) {
      return 'La hora de fin real no puede ser menor que la hora de fin planificada';
    }

    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.programsForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  onSubmit(): void {
    console.log('🚀 Iniciando envío del formulario...');
    console.log('📋 Estado del formulario - Valid:', this.programsForm.valid);
    console.log('📋 Errores del formulario:', this.programsForm.errors);
    console.log('📋 Valores del formulario:', this.programsForm.value);

    if (this.programsForm.invalid) {
      console.warn('⚠️ Formulario inválido, marcando campos como touched');
      this.markFormGroupTouched(this.programsForm);

      // Mostrar qué campos específicos tienen errores
      Object.keys(this.programsForm.controls).forEach(key => {
        const control = this.programsForm.get(key);
        if (control && control.invalid) {
          console.error(`❌ Campo "${key}" tiene errores:`, control.errors);
        }
      });

      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Por favor, revisa los campos marcados en rojo.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Verificar validaciones cruzadas
    const formError = this.getFormError();
    if (formError) {
      console.error('❌ Error de validación cruzada:', formError);
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: formError,
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const orgId = this.authService.getCurrentOrganizationId();
    if (!orgId) {
      console.error('❌ No se encontró ID de organización');
      Swal.fire({
        icon: 'error',
        title: 'Error de configuración',
        text: 'No se pudo obtener la información de la organización. Por favor, inicia sesión nuevamente.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    console.log('✅ Formulario válido, procediendo a enviar...');
    this.isSubmitting = true;

    // Preparar los datos del formulario
    const formData = this.prepareFormData();
    console.log('📤 Datos del formulario a enviar:', formData);

    // Incluimos organizationId en la data enviada
    const finalData: DistributionProgram = {
      ...formData,
      organizationId: orgId
    };

    console.log('📤 Datos finales a enviar:', finalData);

    const request = this.isEditMode
      ? this.programsService.updateProgram(this.programId!, finalData)
      : this.programsService.createProgram(finalData);

    request.subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: this.isEditMode ? 'Programa actualizado' : 'Programa creado',
          text: this.isEditMode
            ? 'El programa de distribución se actualizó correctamente.'
            : 'El programa de distribución se creó correctamente.',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.router.navigate(['/admin/distribution/programs']);
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('❌ Error al guardar programa:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al guardar el programa.',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/distribution/programs']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => control.markAsTouched());
  }

  private formatDateOnly(dateStr: string): string {
    if (!dateStr) return '';
    // Si ya es un formato de fecha (YYYY-MM-DD), retornarlo tal como está
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    // Si es un datetime, extraer solo la fecha
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  private formatTimeOnly(time: string): string {
    if (!time) return '';
    // Si ya es un formato de hora (HH:MM), retornarlo tal como está
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }
    // Si es un datetime, extraer solo la hora
    const date = new Date(time);
    if (isNaN(date.getTime())) return '';
    return date.toTimeString().slice(0, 5);
  }



  private prepareFormData(): any {
    const form = this.programsForm.getRawValue(); // 🔹 Incluye los disabled
    console.log('📋 Valores del formulario:', form);

    const programDate = this.formatDateOnly(form.programDate);
    const base = {
      programCode: form.programCode,
      programDate,
      plannedStartTime: this.formatTimeOnly(form.plannedStartTime),
      plannedEndTime: this.formatTimeOnly(form.plannedEndTime),
      actualStartTime: form.actualStartTime ? this.formatTimeOnly(form.actualStartTime) : null,
      actualEndTime: form.actualEndTime ? this.formatTimeOnly(form.actualEndTime) : null,
      organizationId: form.organizationId,
      zoneId: form.zoneId || null,
      streetId: form.streetId || null,
      routeId: form.routeId || null,
      scheduleId: form.scheduleId || null,
      responsibleUserId: form.responsibleUserId || null,
      status: form.status,
      observations: form.observations
    };

    console.log('📋 Datos base preparados:', base);
    return this.isEditMode ? { ...base, id: this.programId! } : base;
  }

  private loadProgram(): void {
    if (!this.programId) return;

    this.programsService.getProgramById(this.programId).subscribe({
      next: (program) => {
        const dateOnly = program.programDate;
        console.log('📋 Programa cargado:', program);

        // Cargar datos de la organización, zonas y calles primero
        if (program.organizationId) {
          this.loadInitialData();

          // Usar setTimeout para dar tiempo a que se carguen los datos
          setTimeout(() => {
            this.programsForm.patchValue({
              programCode: program.programCode,
              programDate: dateOnly,
              plannedStartTime: program.plannedStartTime || '',
              plannedEndTime: program.plannedEndTime || '',
              actualStartTime: program.actualStartTime || '',
              actualEndTime: program.actualEndTime || '',
              organizationId: program.organizationId,
              routeId: program.routeId,
              scheduleId: program.scheduleId,
              zoneId: program.zoneId,
              streetId: program.streetId,
              responsibleUserId: program.responsibleUserId,
              status: program.status,
              observations: program.observations
            });

            // Bloquear la fecha para que no se pueda editar
            this.programsForm.get('programDate')?.disable();

            // Si hay zonaId, cargar las calles correspondientes
            if (program.zoneId) {
              this.loadStreetsByZone(program.zoneId);
            }

            if (this.isViewMode) {
              this.programsForm.disable();
            }
          }, 500); // Esperar 500ms para que se carguen los datos
        }
      },
      error: (error) => {
        console.error('Error al cargar programa:', error);
        this.error = 'Error al cargar el programa';
      }
    });
  }

  private loadInitialData(): void {
    const orgId = this.authService.getCurrentOrganizationId();
    if (!orgId) {
      console.warn('⚠ No hay organizationId en el contexto.');
      return;
    }

    // Evitar cargar datos múltiples veces
    if (this.selectedOrganization && this.selectedOrganization.organizationId === orgId) {
      return;
    }

    console.log('🔄 Cargando datos iniciales para organización:', orgId);

    this.organizationService.getOrganizationById(orgId).subscribe({
      next: (org) => {
        console.log('📌 Organización cargada:', org);

        this.selectedOrganization = org;
        this.organizations = [org];

        this.programsForm.patchValue({ organizationId: org.organizationId });
        this.programsForm.get('organizationId')?.disable();

        // Cargar zonas de la organización
        this.loadZonesByOrganization(org.organizationId);

        this.loadRoutes(org.organizationId);
        this.loadSchedules(org.organizationId);
        this.loadResponsible();
      },
      error: (err) => {
        console.error('❌ Error cargando organización:', err);
        this.error = 'Error al cargar la organización';
      }
    });
  }

  onOrganizationChange(orgId: string) {
    this.loadZonesByOrganization(orgId);
    this.streets = [];
    this.programsForm.patchValue({ zoneId: '', streetId: '' });
  }

  onZoneChange(zoneId: string | null) {
    console.log('🔄 Cambio de zona:', zoneId);
    if (zoneId && zoneId !== '') {
      this.loadStreetsByZone(zoneId);
    } else {
      this.streets = [];
    }
    this.programsForm.patchValue({ streetId: '' });
  }
}
