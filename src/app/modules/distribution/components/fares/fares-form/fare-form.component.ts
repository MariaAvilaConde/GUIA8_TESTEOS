import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { DistributionService } from '../../../services/distribution.service';
import { OrganizationService } from '../../../../../core/services/organization.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { fares, faresUpdate, faresCreate } from '../../../../../core/models/distribution.model';
import { organization } from '../../../../../core/models/organization.model';

@Component({
  selector: 'app-fare-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './fare-form.component.html',
  styleUrl: './fare-form.component.css'
})
export class FareFormComponent implements OnInit {
  fareForm: FormGroup;
  isEditMode: boolean = false;
  fareId: string = '';
  loading: boolean = false;
  organizations: organization[] = [];
  public currentUser: any = null;

  fareType = [
    { value: 'DIARIA', label: 'DIARIA' },
    { value: 'MENSUAL', label: 'MENSUAL' },
    { value: 'ANUAL', label: 'ANUAL' }
  ];

  constructor(
    private fb: FormBuilder,
    private distributionService: DistributionService,
    private organizationService: OrganizationService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.fareForm = this.fb.group({
      organizationId: [{ value: '', disabled: true }, Validators.required], // deshabilitado para que no se edite manualmente
      fareCode: [{ value: '', disabled: true }, Validators.required], // deshabilitado para que no se edite manualmente
      fareName: ['', [Validators.required, Validators.minLength(3)]],
      fareType: ['', Validators.required],
      fareAmount: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Obtener el usuario actual
    this.currentUser = this.authService.getCurrentUser();
    
    if (!this.currentUser) {
      Swal.fire('Error', 'Usuario no autenticado', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadOrganizations();
    this.checkEditMode();

    if (!this.isEditMode) {
      this.generateFareCode();
    }
  }

  generateFareCode() {
    this.distributionService.getAllF().subscribe({
      next: (fares: fares[]) => {
        const codes = fares
          .map(f => f.fareCode)
          .filter(code => code.startsWith('TAR'))
          .map(code => parseInt(code.replace('TAR', ''), 10))
          .filter(num => !isNaN(num));

        const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
        const nextCode = `TAR${(maxCode + 1).toString().padStart(3, '0')}`;

        this.fareForm.patchValue({ fareCode: nextCode });
      },
      error: (err: any) => {
        console.error('Error al generar código de tarifa', err);
        Swal.fire('Error', 'No se pudo generar el código de la tarifa', 'error');
      }
    });
  }

  loadOrganizations() {
    this.organizationService.getAllOrganization().subscribe({
      next: (data) => {
        // Filtrar solo la organización del usuario actual
        this.organizations = data.filter(org => 
          org.status === 'ACTIVE' && org.organizationId === this.currentUser.organizationId
        );
        
        // Si hay una organización del usuario, pre-seleccionarla
        if (this.organizations.length > 0 && !this.isEditMode) {
          this.fareForm.patchValue({
            organizationId: this.currentUser.organizationId
          });
        }
      },
      error: (err) => {
        console.error('Error al cargar organizaciones', err);
        Swal.fire('Error', 'No se pudieron cargar las organizaciones', 'error');
      }
    });
  }

  checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.fareId = id;
      this.loadFare(id);
    }
  }

  loadFare(id: string) {
    this.loading = true;
    this.distributionService.getByIdF(id).subscribe({
      next: (fare: fares) => {
        this.fareForm.patchValue({
          organizationId: fare.organizationId,
          fareCode: fare.fareCode,
          fareName: fare.fareName,
          fareType: fare.fareType,
          fareAmount: fare.fareAmount
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar tarifa', err);
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar la tarifa', 'error');
        this.router.navigate(['/admin/distribution/fares']);
      }
    });
  }

  onSubmit() {
    if (this.fareForm.valid) {
      this.loading = true;
      const formData = {
        ...this.fareForm.getRawValue() // incluye fareCode aunque esté disabled
      };

      if (this.isEditMode) {
        const updateData: faresUpdate = {
          organizationId: formData.organizationId,
          fareCode: formData.fareCode,
          fareName: formData.fareName,
          fareType: formData.fareType,
          fareAmount: formData.fareAmount
        };

        this.distributionService.updateFares(this.fareId, updateData).subscribe({
          next: () => {
            this.loading = false;
            Swal.fire('Éxito', 'Tarifa actualizada correctamente', 'success').then(() => {
              this.router.navigate(['/admin/distribution/fares']);
            });
          },
          error: (err) => {
            console.error('Error al actualizar tarifa', err);
            this.loading = false;
            Swal.fire('Error', 'No se pudo actualizar la tarifa', 'error');
          }
        });
      } else {
        const createData: faresCreate = {
          organizationId: formData.organizationId,
          fareCode: formData.fareCode,
          fareName: formData.fareName,
          fareType: formData.fareType,
          fareAmount: formData.fareAmount
        };

        this.distributionService.saveFares(createData).subscribe({
          next: () => {
            this.loading = false;
            Swal.fire('Éxito', 'Tarifa creada correctamente', 'success').then(() => {
              this.router.navigate(['/admin/distribution/fares']);
            });
          },
          error: (err) => {
            console.error('Error al crear tarifa', err);
            this.loading = false;
            Swal.fire('Error', 'No se pudo crear la tarifa', 'error');
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.fareForm.controls).forEach(key => {
      const control = this.fareForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Los cambios no guardados se perderán',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.router.navigate(['/admin/distribution/fares']);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.fareForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['min']) return 'El valor debe ser mayor o igual a 0';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.fareForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getCurrentOrganizationName(): string {
    if (!this.currentUser?.organizationId) return 'Sin organización';
    const org = this.organizations.find(o => o.organizationId === this.currentUser.organizationId);
    return org ? org.organizationName : 'Organización desconocida';
  }
}
