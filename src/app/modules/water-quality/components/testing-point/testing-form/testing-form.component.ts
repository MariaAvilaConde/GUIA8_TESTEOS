import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WaterQualityService } from '../../../../../core/services/water-quality.service';
import { testing_points, PointType, Status } from '../../../../../core/models/water-quality.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { organization, zones } from '../../../../../core/models/organization.model';
import { OrganizationService } from 'app/modules/organizations/components/services/organization.service';
import { OrganizationResolverService, StreetData } from 'app/modules/organizations/components/services/organization-resolver.service';

@Component({
  selector: 'app-testing-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './testing-form.component.html',
  styleUrl: './testing-form.component.css'
})
export class TestingFormComponent implements OnInit {
  pointForm!: FormGroup;
  isEditMode = false;
  pointId: string = '';
  loading = false;
  isSubmitting = false;
  showAlert = false;
  alertType: 'success' | 'error' | 'info' = 'info';
  alertMessage = '';
  originalValues: any = {};
  zones: zones[] = [];
  organizations: organization[] = [];
  organizationName: string = '';
  currentUserOrganizationId: string | null = null;
  streets: StreetData[] = [];
  showStreetField: boolean = false;
  constructor(
    private fb: FormBuilder,
    private waterQualityService: WaterQualityService,
    private organizationService: OrganizationService,
    private route: ActivatedRoute,
    private router: Router,
    private organizationResolver: OrganizationResolverService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.setCurrentUserOrganization();
    this.initForm();
    this.checkEditMode();
    this.loadOrganizations();
    this.loadZones();
  }

  private setCurrentUserOrganization(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.organizationId) {
      this.currentUserOrganizationId = currentUser.organizationId;
      
      // Obtener el nombre real de la organización
      this.organizationResolver.getOrganizationName(this.currentUserOrganizationId).subscribe({
        next: (organizationName) => {
          this.organizationName = organizationName;
          console.log('Nombre de organización cargado:', this.organizationName);
        },
        error: (error) => {
          console.error('Error al cargar nombre de organización:', error);
          this.organizationName = `Organización ${this.currentUserOrganizationId}`;
        }
      });
      
      console.log('Organización del usuario:', this.currentUserOrganizationId);
    } else {
      console.error('Usuario no tiene organización asignada');
      this.router.navigate(['/unauthorized']);
    }
  }

  private initForm(): void {
    this.pointForm = this.fb.group({
      pointName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      pointType: ['', [Validators.required]],
      organizationId: [this.currentUserOrganizationId || '', [Validators.required]],
      zoneId: ['', [Validators.required]],
      streetId: [null],
      locationDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      latitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]]
    });

    // Deshabilitar el campo de organización ya que no es editable
    if (this.currentUserOrganizationId) {
      this.pointForm.get('organizationId')?.disable();
    }

    // Escuchar cambios en el tipo de punto
    this.pointForm.get('pointType')?.valueChanges.subscribe(value => {
      this.onPointTypeChange(value);
    });

    // Escuchar cambios en la zona para cargar calles
    this.pointForm.get('zoneId')?.valueChanges.subscribe(value => {
      this.onZoneChange(value);
    });
  }

  private checkEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.pointId = params['id'];
        this.loadPoint();
      }
    });
  }

  private loadPoint(): void {
    this.loading = true;
    this.waterQualityService.getPointstById(this.pointId).subscribe({
      next: (point) => {
        this.populateForm(point);
        this.originalValues = { ...point };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar el punto de prueba:', error);
        this.showErrorAlert('Error al cargar el punto de prueba');
        this.loading = false;
      }
    });
  } 

  loadZones(): void {
    if (this.currentUserOrganizationId) {
      this.organizationService.getAllZones().subscribe({
        next: (zones) => {
          // Filtrar solo las zonas de la organización del usuario
          this.zones = zones.filter(zone => zone.organizationId === this.currentUserOrganizationId);
        }
      });
    }
  }

  loadStreets(): void {
    if (this.currentUserOrganizationId) {
      this.organizationResolver.getAllStreets().subscribe({
        next: (streets) => {
          // Filtrar calles por zonas de la organización del usuario
          const organizationZoneIds = this.zones.map(zone => zone.zoneId);
          this.streets = streets.filter(street => organizationZoneIds.includes(street.zoneId));
        },
        error: (error) => {
          console.error('Error al cargar calles:', error);
        }
      });
    }
  }

  onPointTypeChange(pointType: string): void {
    this.showStreetField = pointType === 'DOMICILIO';
    
    // Actualizar validaciones del campo streetId
    const streetControl = this.pointForm.get('streetId');
    if (this.showStreetField) {
      streetControl?.setValidators([Validators.required]);
      // Cargar calles si aún no se han cargado
      if (this.streets.length === 0) {
        this.loadStreets();
      }
    } else {
      streetControl?.clearValidators();
      streetControl?.setValue(null);
    }
    streetControl?.updateValueAndValidity();
    console.log('Point type changed to:', pointType, 'Show street field:', this.showStreetField);
  }

  onZoneChange(zoneId: string): void {
    // Filtrar calles por zona seleccionada
    if (zoneId && this.showStreetField) {
      this.organizationResolver.getStreetsByZone(zoneId).subscribe({
        next: (streets) => {
          this.streets = streets;
          console.log('Streets loaded for zone:', zoneId, streets);
        },
        error: (error) => {
          console.error('Error al cargar calles de la zona:', error);
        }
      });
    }
    
    // Limpiar selección de calle cuando cambie la zona
    this.pointForm.get('streetId')?.setValue(null);
  }

  loadOrganizations(): void {
    // No es necesario cargar todas las organizaciones ya que solo se muestra la del usuario
    // Se mantiene el método por compatibilidad pero no hace nada
  }

  

  private populateForm(point: testing_points): void {
    this.pointForm.patchValue({
      pointName: point.pointName,
      pointType: point.pointType,
      organizationId: this.currentUserOrganizationId, // Usar la organización del usuario logueado
      zoneId: point.zoneId,
      streetId: (point as any).streetId || null,
      locationDescription: point.locationDescription,
      latitude: point.coordinates.latitude,
      longitude: point.coordinates.longitude
    });

    // Asegurar que la organización esté deshabilitada
    this.pointForm.get('organizationId')?.disable();
    
    // Configurar campo de calle si es necesario
    if (point.pointType === 'DOMICILIO') {
      this.showStreetField = true;
      // Cargar calles de la zona específica para el modo editar
      if (point.zoneId) {
        this.organizationResolver.getStreetsByZone(point.zoneId).subscribe({
          next: (streets) => {
            this.streets = streets;
            console.log('Streets loaded for editing:', streets);
            // Establecer el valor del streetId después de cargar las calles
            if ((point as any).streetId) {
              this.pointForm.patchValue({ streetId: (point as any).streetId });
              console.log('Setting streetId to:', (point as any).streetId);
            }
          },
          error: (error) => {
            console.error('Error al cargar calles de la zona:', error);
          }
        });
      }
    }
  }

  onSubmit(): void {
    if (this.pointForm.valid) {
      this.isSubmitting = true;
      
      const formData = this.prepareFormData();
      console.log('Form data being sent:', formData);
      console.log('Current form values:', this.pointForm.getRawValue());
      
      if (this.isEditMode) {
        this.updatePoint(formData);
      } else {
        this.createPoint(formData);
      }
    } else {
      this.markFormGroupTouched();
      this.showErrorAlert('Por favor, complete todos los campos requeridos correctamente');
    }
  }

  private prepareFormData(): any {
    // Use getRawValue() to get all form values including disabled ones
    const formValue = this.pointForm.getRawValue();
    
    const baseData = {
      pointName: formValue.pointName,
      pointType: formValue.pointType,
      organizationId: this.currentUserOrganizationId, // Usar la organización del usuario logueado
      zoneId: formValue.zoneId,
      locationDescription: formValue.locationDescription,
      coordinates: {
        latitude: Number(formValue.latitude),
        longitude: Number(formValue.longitude)
      }
    };

    // Always include streetId field for DOMICILIO type points
    if (formValue.pointType === 'DOMICILIO') {
      (baseData as any).streetId = formValue.streetId || null;
    } else {
      // For non-DOMICILIO types, explicitly set streetId to null
      (baseData as any).streetId = null;
    }

    if (this.isEditMode && this.originalValues.pointCode) {
      return {
        ...baseData,
        pointCode: this.originalValues.pointCode
      };
    }

    return baseData;
  }

  private createPoint(pointData: any): void {
    this.waterQualityService.createTestingPoint(pointData).subscribe({
      next: () => {
        this.showSuccessAlert('Punto de prueba creado exitosamente');
        setTimeout(() => {
          this.router.navigate(['/admin/water-quality/testing']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error al crear el punto de prueba:', error);
        this.showErrorAlert('Error al crear el punto de prueba');
        this.isSubmitting = false;
      }
    });
  }

  private updatePoint(pointData: any): void {
    this.waterQualityService.updateTestingPoint(this.pointId, pointData).subscribe({
      next: () => {
        this.showSuccessAlert('Punto de prueba actualizado exitosamente');
        setTimeout(() => {
          this.router.navigate(['/admin/water-quality/testing']);
        }, 1500);
      },
      error: (error: any) => {
        console.error('Error al actualizar el punto de prueba:', error);
        this.showErrorAlert('Error al actualizar el punto de prueba');
        this.isSubmitting = false;
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.pointForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.pointForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `Valor mínimo: ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `Valor máximo: ${field.errors['max'].max}`;
      }
    }
    return 'Campo inválido';
  }

  isFormValid(): boolean {
    return this.pointForm.valid;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.pointForm.controls).forEach(key => {
      const control = this.pointForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/water-quality/testing-points']);
  }

  showSuccessAlert(message: string): void {
    this.alertType = 'success';
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => this.dismissAlert(), 5000);
  }

  showErrorAlert(message: string): void {
    this.alertType = 'error';
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => this.dismissAlert(), 5000);
  }

  showInfoAlert(message: string): void {
    this.alertType = 'info';
    this.alertMessage = message;
    this.showAlert = true;
    setTimeout(() => this.dismissAlert(), 5000);
  }

  dismissAlert(): void {
    this.showAlert = false;
  }
}
