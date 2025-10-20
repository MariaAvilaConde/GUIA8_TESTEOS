import { CommonModule } from '@angular/common';
  import Swal from 'sweetalert2';
  import { Component, OnInit } from '@angular/core';
  import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
  import { BoxService } from '../../../infrastructure/services/box.service';
  import { UserService } from 'app/core/services/user.service';
  import { WaterBoxTransfer } from 'app/core/models/box.model';

  type DocumentKind = 'pdf' | 'jpg' | 'png' | 'docx' | 'xlsx' | 'other';

  @Component({
    selector: 'app-box-transfer',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './box-transfer.component.html'
  })
  export class BoxTransferComponent implements OnInit {
    waterBoxes: { id: number; boxCode: string }[] = [];
  assignmentUsers: { id: number; userId: string, displayName: string }[] = [];
    transfers: WaterBoxTransfer[] = [];
    loading = false;
    loadingAssignments = false;
    showModal = false;
    isEdit = false;
    currentId: number | null = null;
    form: FormGroup;
    availableAssignments: { id: number; label: string; tooltip?: string }[] = [];
    errorMessages = {
      waterBoxes: '',
      assignments: '',
      general: ''
    };

    // Validadores personalizados
    static urlValidator(control: AbstractControl) {
      const value = control.value?.trim();
      if (!value) return null; // URLs vacías son opcionales
      const urlPattern = /^https?:\/\/.+/;
      return urlPattern.test(value) ? null : { invalidUrl: true };
    }

    static transferReasonValidator(control: AbstractControl) {
      const value = control.value?.trim();
      if (!value) return { required: true };
      if (value.length < 10) return { minLength: { actualLength: value.length, requiredLength: 10 } };
      if (value.length > 500) return { maxLength: { actualLength: value.length, requiredLength: 500 } };
      return null;
    }

    constructor(
      private boxService: BoxService,
      private userService: UserService,
      private fb: FormBuilder
    ) {
      this.form = this.fb.group({
        waterBoxId: ['', Validators.required],
        oldAssignmentId: ['', Validators.required],
        newAssignmentId: ['', Validators.required],
        transferReason: ['', BoxTransferComponent.transferReasonValidator],
        documents: this.fb.array([]),
        createdAt: ['']
      });
      
      // Validador personalizado para evitar asignaciones iguales
      this.form.addValidators(() => {
        const oldId = this.form.get('oldAssignmentId')?.value;
        const newId = this.form.get('newAssignmentId')?.value;
        if (oldId && newId && Number(oldId) === Number(newId)) {
          return { sameAssignment: true };
        }
        return null;
      });
      
      this.addDocument();
    }

    ngOnInit() {
      this.fetchTransfers();
      this.fetchWaterBoxes();
      this.form.get('waterBoxId')?.valueChanges.subscribe((val) => {
        const id = Number(val);
        if (!isNaN(id) && id > 0) {
          this.onWaterBoxIdChange(id);
        } else {
          this.availableAssignments = [];
          this.form.patchValue({ oldAssignmentId: '', newAssignmentId: '' });
        }
      });
    }

    fetchWaterBoxes() {
      this.boxService.getAllWaterBoxes().subscribe({
        next: (boxes) => {
          this.waterBoxes = boxes.map(box => ({ id: box.id, boxCode: box.boxCode }));
          if (this.waterBoxes.length === 0) {
            this.errorMessages.waterBoxes = 'No hay cajas de agua disponibles. Debe crear al menos una caja de agua antes de realizar transferencias.';
          } else {
            this.errorMessages.waterBoxes = '';
          }
        },
        error: (err) => {
          console.error('Error loading water boxes:', err);
          this.errorMessages.waterBoxes = 'Error al cargar las cajas de agua. Por favor, intente nuevamente.';
          Swal.fire('Error', 'No se pudieron cargar las cajas de agua.', 'error');
        }
      });
    }

    private onWaterBoxIdChange(waterBoxId: number) {
      this.loadingAssignments = true;
      this.errorMessages.assignments = '';
      this.availableAssignments = [];
      
      this.boxService.getWaterBoxAssignmentsByBoxId(waterBoxId).subscribe({
        next: (list) => {
          // Filtrar solo asignaciones activas
          const activeAssignments = list.filter(assignment => assignment.status === 'ACTIVE');
          
          if (activeAssignments.length === 0) {
            this.errorMessages.assignments = 'Esta caja de agua no tiene asignaciones activas. Debe tener al menos una asignación activa antes de realizar transferencias.';
            this.loadingAssignments = false;
            return;
          }

          if (activeAssignments.length < 2) {
            this.errorMessages.assignments = 'Se necesitan al menos 2 asignaciones activas para realizar una transferencia.';
            this.loadingAssignments = false;
            return;
          }

          const userIds = activeAssignments.map(a => a.userId);
          this.boxService.getClients().subscribe({
            next: (users) => {
              // Construir mapa id -> displayName (firstName + lastName) o username como fallback
              const userMap = new Map<string, string>(users.map(u => {
                const nameParts = [(u.firstName || '').trim(), (u.lastName || '').trim()].filter(p => p && p.length > 0);
                const display = nameParts.length > 0 ? nameParts.join(' ') : (u.username || 'Usuario desconocido');
                return [u.id, display] as [string, string];
              }));
              this.assignmentUsers = activeAssignments.map(a => ({
                id: a.id,
                userId: a.userId,
                displayName: userMap.get(a.userId) || 'Usuario desconocido'
              }));
              this.availableAssignments = activeAssignments
                .sort((a, b) => a.id - b.id)
                .map(a => {
                  const start = a.startDate ? new Date(a.startDate).toLocaleDateString() : '';
                  const end = a.endDate ? new Date(a.endDate).toLocaleDateString() : '';
                  const tooltip = `Período: ${start}${end ? ' - ' + end : ' - Actual'}`;
                  return {
                    id: a.id,
                    label: userMap.get(a.userId) || 'Usuario desconocido',
                    tooltip
                  };
                });
              this.loadingAssignments = false;
            },
            error: (err) => {
              console.error('Error loading clients', err);
              this.errorMessages.assignments = 'Error al cargar los usuarios. Por favor, intente nuevamente.';
              this.loadingAssignments = false;
            }
          });
        },
        error: (err) => {
          console.error('Error loading assignments by waterBoxId', err);
          this.errorMessages.assignments = 'Error al cargar las asignaciones de esta caja de agua.';
          this.availableAssignments = [];
          this.loadingAssignments = false;
        }
      });
    }

    getBoxCodeById(id: number): string {
      const box = this.waterBoxes.find(b => b.id === id);
      return box ? box.boxCode : id.toString();
    }

    getUsernameByAssignmentId(id: number): string {
      const assign = this.assignmentUsers.find(a => a.id === id);
      return assign && assign.displayName ? assign.displayName : 'Usuario desconocido';
    }

    addDocument(): void {
      this.documents.push(this.newDocument());
    }

    get documents(): FormArray {
      return this.form.get('documents') as FormArray;
    }

    newDocument(url: string = ''): FormGroup {
      return this.fb.group({ 
        url: [url, BoxTransferComponent.urlValidator] 
      });
    }

    removeDocument(i: number): void {
      this.documents.removeAt(i);
    }

    setDocuments(documents: string[] | { url: string }[]): void {
      this.documents.clear();
      documents.forEach((doc) => {
        const url = typeof doc === 'string' ? doc : doc.url;
        this.documents.push(this.newDocument(url));
      });
    }

    detectDocumentType(fileNameOrUrl: string): DocumentKind {
      const extension = fileNameOrUrl.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf': return 'pdf';
        case 'jpg':
        case 'jpeg': return 'jpg';
        case 'png': return 'png';
        case 'docx': return 'docx';
        case 'xlsx': return 'xlsx';
        default: return 'other';
      }
    }

    deleteTransfer(id: number) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: 'No podrás revertir esto.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.boxService.deleteWaterBoxTransfer(id).subscribe(() => {
            this.fetchTransfers();
            Swal.fire('¡Eliminado!', 'La transferencia ha sido eliminada.', 'success');
          });
        }
      });
    }

    restoreTransfer(id: number) {
      Swal.fire({
        title: '¿Estás seguro de restaurar?',
        text: 'Esta acción restaurará la transferencia.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, restaurar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.boxService.restoreWaterBoxTransfer(id).subscribe(() => {
            this.fetchTransfers();
            Swal.fire('¡Restaurado!', 'La transferencia ha sido restaurada.', 'success');
          });
        }
      });
    }

    private statusToLabel(status?: string): string {
      switch ((status || '').toUpperCase()) {
        case 'ACTIVE': return 'Activo';
        case 'INACTIVE': return 'Inactivo';
        case 'COMPLETED': return 'Completado';
        case 'CANCELLED': return 'Cancelado';
        default: return (status || '').toString();
      }
    }

    fetchTransfers() {
      this.loading = true;
      this.errorMessages.general = '';
      
      this.boxService.getAllWaterBoxTransfers().subscribe({
        next: (data) => {
          if (data.length === 0) {
            this.transfers = [];
            this.loading = false;
            return;
          }

          // 1) Tomamos todos los IDs de asignación de las transferencias
          const assignIds = data.flatMap(t => [t.oldAssignmentId, t.newAssignmentId]).filter(id => id != null) as number[];
          // 2) Obtenemos las asignaciones por esos IDs -> Map id -> asignación
          this.boxService.getAssignmentsByIds(assignIds).subscribe({
            next: (assignMap) => {
              // 3) Con las asignaciones, recogemos sus userIds únicos
              const userIds = Array.from(assignMap.values()).map(a => a.userId);
              // 4) Obtener los clientes completos y construir nombres para mostrar
              this.boxService.getClients().subscribe({
                next: (users) => {
                  const filtered = users.filter(u => userIds.includes(u.id));
                  const userMap = new Map<string, string>(filtered.map(u => {
                    const nameParts = [(u.firstName || '').trim(), (u.lastName || '').trim()].filter(p => p && p.length > 0);
                    const display = nameParts.length > 0 ? nameParts.join(' ') : (u.username || 'Usuario desconocido');
                    return [u.id, display] as [string, string];
                  }));
                  this.transfers = data.map(t => {
                    const oldAssign = assignMap.get(t.oldAssignmentId);
                    const newAssign = assignMap.get(t.newAssignmentId);
                    const oldUserDisplay = oldAssign ? (userMap.get(oldAssign.userId) || 'Usuario desconocido') : 'Usuario desconocido';
                    const newUserDisplay = newAssign ? (userMap.get(newAssign.userId) || 'Usuario desconocido') : 'Usuario desconocido';
                    return {
                      ...t,
                      oldAssignmentUsername: oldUserDisplay,
                      newAssignmentUsername: newUserDisplay
                    };
                  }).sort((a, b) => a.id - b.id);
                  this.loading = false;
                },
                error: (err) => {
                  console.error('Error loading users:', err);
                  this.errorMessages.general = 'Error al cargar la información de usuarios.';
                  this.loading = false;
                }
              });
            },
            error: (err) => {
              console.error('Error loading assignments:', err);
              this.errorMessages.general = 'Error al cargar la información de asignaciones.';
              this.loading = false;
            }
          });
        },
        error: (err) => {
          console.error('Error loading transfers:', err);
          this.errorMessages.general = 'Error al cargar las transferencias. Por favor, intente nuevamente.';
          this.loading = false;
        }
      });
    }

    openModal(edit: boolean = false, transfer?: WaterBoxTransfer) {
      this.showModal = true;
      this.isEdit = edit;
      if (this.isEdit && transfer) {
        this.currentId = transfer.id;
        this.form.patchValue({ ...transfer, documents: null });
        this.setDocuments(transfer.documents || []);
        if (transfer.waterBoxId) {
          this.onWaterBoxIdChange(transfer.waterBoxId);
        }
      } else {
        this.currentId = null;
        this.form.reset();
        this.documents.clear();
        this.addDocument();
      }
    }

    closeModal() {
      this.showModal = false;
      this.form.reset();
      this.currentId = null;
    }

    submit() {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.showValidationErrors();
        return;
      }

      // Validar que haya al menos un documento válido si se proporcionaron URLs
      const documentUrls: string[] = this.documents.controls
        .map(control => (control.value?.url || '').trim())
        .filter(url => url.length > 0);

      // Validar URLs si existen
      const invalidUrls = this.documents.controls.some(control => 
        control.get('url')?.invalid && control.get('url')?.value?.trim()
      );

      if (invalidUrls) {
        Swal.fire('Error', 'Por favor, corrija las URLs inválidas antes de continuar.', 'error');
        return;
      }

      this.proceedSave(documentUrls);
    }

    private showValidationErrors() {
      let errorMessage = 'Por favor, corrija los siguientes errores:\n';
      
      if (this.form.get('waterBoxId')?.invalid) {
        errorMessage += '• Seleccione una caja de agua\n';
      }
      
      if (this.form.get('oldAssignmentId')?.invalid) {
        errorMessage += '• Seleccione la asignación anterior\n';
      }
      
      if (this.form.get('newAssignmentId')?.invalid) {
        errorMessage += '• Seleccione la nueva asignación\n';
      }
      
      if (this.form.errors?.['sameAssignment']) {
        errorMessage += '• Las asignaciones antigua y nueva no pueden ser iguales\n';
      }
      
      const reasonControl = this.form.get('transferReason');
      if (reasonControl?.invalid) {
        if (reasonControl.errors?.['required']) {
          errorMessage += '• El motivo de transferencia es requerido\n';
        } else if (reasonControl.errors?.['minLength']) {
          errorMessage += '• El motivo debe tener al menos 10 caracteres\n';
        } else if (reasonControl.errors?.['maxLength']) {
          errorMessage += '• El motivo no puede exceder 500 caracteres\n';
        }
      }

      Swal.fire('Formulario incompleto', errorMessage, 'warning');
    }

    private proceedSave(documentUrls: string[]) {
      const raw = this.form.value as any;
      const value = {
        ...raw,
        waterBoxId: Number(raw.waterBoxId),
        oldAssignmentId: Number(raw.oldAssignmentId),
        newAssignmentId: Number(raw.newAssignmentId),
        documents: documentUrls
      };

      Swal.fire({
        title: this.isEdit ? 'Actualizando...' : 'Creando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      if (this.isEdit && this.currentId !== null) {
        this.boxService.updateWaterBoxTransfer(this.currentId, value).subscribe({
          next: () => {
            Swal.close();
            this.fetchTransfers();
            this.closeModal();
            Swal.fire('¡Actualizada!', 'La transferencia se actualizó correctamente.', 'success');
          },
          error: (err: any) => {
            Swal.close();
            console.error('Error updating transfer:', err);
            const errorMsg = this.getErrorMessage(err);
            Swal.fire('Error al actualizar', errorMsg, 'error');
          }
        });
      } else {
        this.boxService.createWaterBoxTransfer(value).subscribe({
          next: () => {
            Swal.close();
            this.fetchTransfers();
            this.closeModal();
            Swal.fire('¡Creada!', 'La transferencia se creó correctamente.', 'success');
          },
          error: (err: any) => {
            Swal.close();
            console.error('Error creating transfer:', err);
            const errorMsg = this.getErrorMessage(err);
            Swal.fire('Error al crear', errorMsg, 'error');
          }
        });
      }
    }

    private getErrorMessage(error: any): string {
      if (error?.error?.message) {
        return error.error.message;
      } else if (error?.message) {
        return error.message;
      } else if (error?.status === 400) {
        return 'Los datos enviados no son válidos. Verifique la información.';
      } else if (error?.status === 403) {
        return 'No tiene permisos para realizar esta acción.';
      } else if (error?.status === 404) {
        return 'No se encontró el recurso solicitado.';
      } else if (error?.status === 500) {
        return 'Error interno del servidor. Intente nuevamente más tarde.';
      } else {
        return 'Ocurrió un error inesperado. Por favor, intente nuevamente.';
      }
    }
  }
