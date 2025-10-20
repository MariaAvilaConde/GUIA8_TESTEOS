import { Component, OnInit } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Inject } from '@angular/core';
import Swal from 'sweetalert2';
import { of, Observable, throwError } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';

import { Incident, IncidentType, IncidentResolution } from '../../models/complaints-incidents.models';
import { IncidentsService } from '../../services/incidents.service';
import { IncidentTypesService } from '../../services/incident-types.service';
import { IncidentResolutionsService } from '../../services/incident-resolutions.service';
import { ClientsService, ClientData } from '../../services/clients.service';
import { UserResponseDTO } from '../../../../core/models/user.model';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ProductResponse } from '../../../../core/models/inventory.model';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { OrganizationService } from '../../../../core/services/organization.service';
import { organization } from '../../../../core/models/organization.model';

@Component({
  selector: 'app-incident-form-modal',
  templateUrl: './incident-form-modal.component.html',
  styleUrls: ['./incident-form-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule
  ]
})
export class IncidentFormModalComponent implements OnInit {
  incidentForm: FormGroup;
  resolutionForm: FormGroup;
  incidentTypes: IncidentType[] = [];
  clientUsers: UserResponseDTO[] = [];
  products: ProductResponse[] = [];
  organizationDisplayText: string = '';
  isEditing = false;
  isLoadingTypes = true;
  isLoadingUsers = true;
  isLoadingProducts = true;
  showResolutionDetails = false;
  existingResolutionId: string | null = null; // Para manejar edición de resoluciones
  originalMaterialsUsed: any[] = []; // Para comparar cambios en materiales al editar
  
  // Estados de carga separados para mejorar UX
  isSavingIncident = false;
  isSavingResolution = false;
  incidentSaved = false; // Para saber si la incidencia ya fue guardada

  severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  incidentCategories = ['GENERAL', 'CALIDAD', 'DISTRIBUCION'];

  esSeverity = [
    { value: 'LOW', label: 'Baja' },
    { value: 'MEDIUM', label: 'Media' },
    { value: 'HIGH', label: 'Alta' },
    { value: 'CRITICAL', label: 'Crítica' }
  ];

  constructor(
    private fb: FormBuilder,
    private incidentsService: IncidentsService,
    private incidentTypesService: IncidentTypesService,
    private resolutionService: IncidentResolutionsService,
    private clientsService: ClientsService,
    private inventoryService: InventoryService,
    private organizationContextService: OrganizationContextService,
    private organizationService: OrganizationService,
    public dialogRef: MatDialogRef<IncidentFormModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { incident: Incident | null }
  ) {
    this.isEditing = !!data.incident;

    this.incidentForm = this.fb.group({
      incidentCode: ['', Validators.required],
      incidentCategory: ['', Validators.required],
      incidentDate: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      severity: ['', Validators.required],
      status: ['REPORTED', Validators.required],
      organizationId: ['', Validators.required],
      incidentTypeId: ['', Validators.required],
      zoneId: [''],
      affectedBoxesCount: [0],
      reportedByUserId: [''],
      assignedToUserId: [''],
      resolved: [false]
    });

    this.resolutionForm = this.fb.group({
      incidentId: [''],
      resolutionDate: [formatDate(new Date(), 'yyyy-MM-dd', 'en-US'), Validators.required],
      resolutionType: ['', Validators.required],
      actionsTaken: ['', Validators.required],
      materialsUsed: this.fb.array([]),
      laborHours: [0, [Validators.required, Validators.min(0)]],
      totalCost: [0, [Validators.required, Validators.min(0)]],
      resolvedByUserId: ['', Validators.required],
      qualityCheck: [false],
      followUpRequired: [false],
      resolutionNotes: ['']
    });

    if (this.isEditing && this.data.incident) {
      const incident = this.data.incident;
      // Procesar la fecha del incidente para asegurar que sea válida
      let incidentDateFormatted;
      try {
        if (incident.incidentDate) {
          const dateObj = new Date(incident.incidentDate);
          if (!isNaN(dateObj.getTime())) {
            incidentDateFormatted = this.formatDateInput(dateObj);
          } else {
            console.warn('Fecha de incidente inválida al cargar para edición:', incident.incidentDate);
            incidentDateFormatted = this.formatDateInput(new Date());
          }
        } else {
          console.warn('Fecha de incidente no proporcionada al cargar para edición');
          incidentDateFormatted = this.formatDateInput(new Date());
        }
      } catch (error) {
        console.error('Error al procesar fecha de incidente para edición:', error);
        incidentDateFormatted = this.formatDateInput(new Date());
      }

      this.incidentForm.patchValue({
        incidentCategory: incident.incidentCategory,
        incidentDate: incidentDateFormatted,
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        organizationId: incident.organizationId,
        incidentCode: incident.incidentCode,
        incidentTypeId: incident.incidentTypeId,
        zoneId: incident.zoneId || '',
        affectedBoxesCount: incident.affectedBoxesCount || 0,
        reportedByUserId: incident.reportedByUserId || '',
        assignedToUserId: incident.assignedToUserId || '',
        resolved: incident.resolved || false
      });

      // Cargar información de la organización para mostrar en modo edición
      if (incident.organizationId) {
        // Usar texto simple para modo edición
        const contextInfo = this.organizationContextService.getContextInfo();
        const userName = contextInfo.userName || 'Usuario';
        this.organizationDisplayText = `Organización de ${userName}`;
        // Deshabilitar el campo en modo edición también
        this.incidentForm.get('organizationId')?.disable();
      }

      // Cargar detalles de resolución si existen, independientemente del estado 'resolved' (según especificación)
      if (incident.id) {
        this.resolutionService.getAll().subscribe({
          next: (allResolutions: IncidentResolution[]) => {
            const foundResolution = allResolutions.find((res: IncidentResolution) => res.incidentId === incident.id);
            if (foundResolution) {
              this.showResolutionDetails = true;
              this.existingResolutionId = foundResolution.id || null; // Guardar ID para edición

              // Guardar materiales originales para comparar cambios
              this.originalMaterialsUsed = foundResolution.materialsUsed ?
                JSON.parse(JSON.stringify(foundResolution.materialsUsed)) : [];

              // Procesar la fecha de resolución para asegurar que sea válida
              let resolutionDateFormatted;
              try {
                if (foundResolution.resolutionDate) {
                  const dateObj = new Date(foundResolution.resolutionDate);
                  if (!isNaN(dateObj.getTime())) {
                    resolutionDateFormatted = this.formatDateInput(dateObj);
                  } else {
                    console.warn('Fecha de resolución inválida al cargar para edición:', foundResolution.resolutionDate);
                    resolutionDateFormatted = this.formatDateInput(new Date());
                  }
                } else {
                  console.warn('Fecha de resolución no proporcionada al cargar para edición');
                  resolutionDateFormatted = this.formatDateInput(new Date());
                }
              } catch (error: any) {
                console.error('Error al procesar fecha de resolución para edición:', error);
                resolutionDateFormatted = this.formatDateInput(new Date());
              }

              this.resolutionForm.patchValue({
                incidentId: foundResolution.incidentId,
                resolutionDate: resolutionDateFormatted,
                resolutionType: foundResolution.resolutionType,
                actionsTaken: foundResolution.actionsTaken,
                laborHours: foundResolution.laborHours,
                totalCost: foundResolution.totalCost,
                resolvedByUserId: foundResolution.resolvedByUserId,
                qualityCheck: foundResolution.qualityCheck,
                followUpRequired: foundResolution.followUpRequired,
                resolutionNotes: foundResolution.resolutionNotes
              });

              // Clear existing materials and add loaded ones
              this.materialsUsed.clear();
              foundResolution.materialsUsed?.forEach((material: { productId: string, quantity: number, unit: string }) => {
                const materialGroup = this.fb.group({
                  productId: [material.productId, Validators.required],
                  quantity: [material.quantity, [Validators.required, Validators.min(1)]],
                  unit: [material.unit, Validators.required]
                });

                // Configurar validadores dinámicos para productos existentes
                materialGroup.get('productId')?.valueChanges.subscribe(productId => {
                  if (productId) {
                    const selectedProduct = this.products.find(product => product.productId === productId);
                    if (selectedProduct) {
                      const maxStock = selectedProduct.currentStock || 0;
                      const quantityControl = materialGroup.get('quantity');
                      quantityControl?.setValidators([
                        Validators.required,
                        Validators.min(1),
                        Validators.max(maxStock)
                      ]);
                      quantityControl?.updateValueAndValidity();
                    }
                  }
                });

                this.materialsUsed.push(materialGroup);
              });

              // Calcular el costo total después de cargar los materiales
              setTimeout(() => {
                this.calculateTotalCost();
              }, 100); // Pequeño delay para asegurar que los productos están cargados
              
              console.log('✅ Detalles de resolución cargados exitosamente (independiente del estado resolved)');
            } else {
              console.log('ℹ️ No se encontró resolución existente para esta incidencia');
            }
          },
          error: (error: any) => {
            console.error('❌ Error cargando detalles de resolución:', error);
          }
        });
      }

    } else {
      this.incidentForm.patchValue({
        reportedByUserId: '',
        zoneId: '',
        incidentCode: 'INC001',
        incidentCategory: 'DISTRIBUCION',
        severity: 'HIGH',
        status: 'REPORTED',
        incidentDate: this.formatDateInput(new Date())
      });
      this.generateNextIncidentCode();
    }
  }

  ngOnInit(): void {
    this.setupOrganizationId();
    this.loadIncidentTypes();
    this.loadClientUsers();
    this.loadProducts();

    this.incidentForm.get('severity')?.valueChanges.subscribe(sev => {
      let hours = 72;
      if (sev === 'MEDIUM') hours = 48;
      if (sev === 'HIGH') hours = 24;
      if (sev === 'CRITICAL') hours = 12;
    });

    this.incidentForm.get('incidentTypeId')?.valueChanges.subscribe(typeId => {
      if (typeId) {
        const selectedType = this.incidentTypes.find(type => type.id === typeId);
        if (selectedType) {
          this.incidentForm.get('severity')?.setValue(selectedType.priorityLevel);
          console.log('Tipo de incidencia seleccionado:', selectedType);
        } else {
          console.warn('Tipo de incidencia no encontrado en la colección incident_type:', typeId);
        }
      }
    });
  }

  setupOrganizationId(): void {
    console.log('🏢 Configurando Organization ID automáticamente...');

    const currentOrgId = this.organizationContextService.getCurrentOrganizationId();
    const contextInfo = this.organizationContextService.getContextInfo();

    console.log('📋 Información del contexto organizacional:', contextInfo);

    if (currentOrgId) {
      // Auto-asignar el organizationId del contexto actual
      this.incidentForm.patchValue({
        organizationId: currentOrgId
      });

      // Hacer el campo readonly para evitar modificaciones
      this.incidentForm.get('organizationId')?.disable();

      // Usar un nombre genérico simple basado en el contexto del usuario
      const userName = contextInfo.userName || 'Usuario';
      this.organizationDisplayText = `Organización de ${userName}`;

      console.log('✅ Organization ID asignado automáticamente:', currentOrgId);
      console.log('📝 Texto de organización generado:', this.organizationDisplayText);
      console.log('🔒 Campo organizationId deshabilitado para edición');
    } else {
      console.warn('⚠️ No se encontró Organization ID en el contexto');
      this.showErrorAlert('No se pudo determinar la organización. Por favor, inicie sesión nuevamente.');
    }
  }

  toggleResolutionDetails(): void {
    this.showResolutionDetails = !this.showResolutionDetails;
  }

  get materialsUsed(): FormArray {
    return this.resolutionForm.get('materialsUsed') as FormArray;
  }

  newMaterial(): FormGroup {
    const materialGroup = this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: ['', Validators.required]
    });

    // Escuchar cambios en productId para actualizar validadores de cantidad
    materialGroup.get('productId')?.valueChanges.subscribe(productId => {
      if (productId) {
        const selectedProduct = this.products.find(product => product.productId === productId);
        if (selectedProduct) {
          const maxStock = selectedProduct.currentStock || 0;
          const quantityControl = materialGroup.get('quantity');
          quantityControl?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(maxStock)
          ]);
          quantityControl?.updateValueAndValidity();
        }
      }
    });

    return materialGroup;
  }

  addMaterial(): void {
    this.materialsUsed.push(this.newMaterial());
    // Recalcular costo total después de agregar material
    this.calculateTotalCost();
  }

  removeMaterial(index: number): void {
    this.materialsUsed.removeAt(index);
    // Recalcular costo total después de remover material
    this.calculateTotalCost();
  }

  onProductChange(index: number): void {
    const materialControl = this.materialsUsed.at(index);
    const productId = materialControl.get('productId')?.value;

    if (productId) {
      const selectedProduct = this.products.find(product => product.productId === productId);
      if (selectedProduct) {
        // Actualizar automáticamente la unidad de medida
        materialControl.get('unit')?.setValue(selectedProduct.unitOfMeasure);

        // Validar y ajustar la cantidad máxima según el stock disponible
        const currentQuantity = materialControl.get('quantity')?.value || 1;
        const maxStock = selectedProduct.currentStock || 0;

        if (currentQuantity > maxStock) {
          materialControl.get('quantity')?.setValue(maxStock);
          if (maxStock === 0) {
            this.showErrorAlert(`El producto "${selectedProduct.productName}" no tiene stock disponible.`);
          } else {
            this.showErrorAlert(`Cantidad ajustada. Stock disponible: ${maxStock} ${selectedProduct.unitOfMeasure}`);
          }
        }

        // Actualizar validadores de cantidad con el stock máximo
        const quantityControl = materialControl.get('quantity');
        quantityControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(maxStock)
        ]);
        quantityControl?.updateValueAndValidity();

        console.log('Producto seleccionado:', selectedProduct);
        console.log('Stock disponible:', maxStock);

        // Recalcular el costo total
        this.calculateTotalCost();
        
        // Verificar el estado del formulario después del cambio
        console.log('🔍 Estado del formulario de resolución después de cambio de producto:', {
          valido: this.resolutionForm.valid,
          errores: this.resolutionForm.errors
        });
      }
    }
  }

  onQuantityChange(index: number): void {
    const materialControl = this.materialsUsed.at(index);
    const productId = materialControl.get('productId')?.value;
    const quantity = materialControl.get('quantity')?.value || 0;

    if (productId && quantity > 0) {
      const selectedProduct = this.products.find(product => product.productId === productId);
      if (selectedProduct) {
        const maxStock = selectedProduct.currentStock || 0;

        // Validar que la cantidad no exceda el stock disponible
        if (quantity > maxStock) {
          materialControl.get('quantity')?.setValue(maxStock);
          if (maxStock === 0) {
            this.showErrorAlert(`El producto "${selectedProduct.productName}" no tiene stock disponible.`);
          } else {
            this.showErrorAlert(`Cantidad ajustada. Stock máximo disponible: ${maxStock} ${selectedProduct.unitOfMeasure}`);
          }
        }
      }
    }

    // Recalcular el costo total cuando cambie la cantidad
    this.calculateTotalCost();
  }

  /**
   * Reconfigura los validadores de materiales después de que los productos se hayan cargado
   * Esto soluciona el problema del botón "Actualizar Resolución" inactivo
   */
  private reconfigureMaterialValidators(): void {
    console.log('🔄 Reconfigurando validadores de materiales con productos cargados...');
    
    this.materialsUsed.controls.forEach((materialControl, index) => {
      const productId = materialControl.get('productId')?.value;
      
      if (productId) {
        const selectedProduct = this.products.find(product => product.productId === productId);
        if (selectedProduct) {
          const maxStock = selectedProduct.currentStock || 0;
          const quantityControl = materialControl.get('quantity');
          
          // Reconfigurar validadores con el stock correcto
          quantityControl?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(maxStock)
          ]);
          quantityControl?.updateValueAndValidity();
          
          console.log(`✅ Validadores reconfigurados para material ${index + 1}:`, {
            producto: selectedProduct.productName,
            stockMaximo: maxStock,
            cantidadActual: quantityControl?.value
          });
        } else {
          console.warn(`⚠️ Producto no encontrado para material ${index + 1}:`, productId);
        }
      }
    });
    
    // Forzar re-validación del formulario completo
    this.resolutionForm.updateValueAndValidity();
    
    console.log('📋 Estado del formulario de resolución después de reconfigurar:');
    console.log('- Válido:', this.resolutionForm.valid);
    console.log('- Errores:', this.resolutionForm.errors);
    
    // Log específico para debugging del botón
    const shouldBeEnabled = this.resolutionForm.valid && !this.isSavingResolution && (this.incidentSaved || this.isEditing);
    console.log('🔘 Estado del botón "Actualizar Resolución":');
    console.log('- resolutionForm.valid:', this.resolutionForm.valid);
    console.log('- !isSavingResolution:', !this.isSavingResolution);
    console.log('- (incidentSaved || isEditing):', (this.incidentSaved || this.isEditing));
    console.log('- Debería estar habilitado:', shouldBeEnabled);
  }

  calculateTotalCost(): void {
    let totalCost = 0;

    this.materialsUsed.controls.forEach((materialControl) => {
      const productId = materialControl.get('productId')?.value;
      const quantity = materialControl.get('quantity')?.value || 0;

      if (productId && quantity > 0) {
        const selectedProduct = this.products.find(product => product.productId === productId);
        if (selectedProduct && selectedProduct.unitCost) {
          const materialCost = selectedProduct.unitCost * quantity;
          totalCost += materialCost;
        }
      }
    });

    // Actualizar el campo de costo total en el formulario
    this.resolutionForm.get('totalCost')?.setValue(totalCost);

    console.log('Costo total calculado:', totalCost);
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.productId === productId);
    return product ? product.productName : productId;
  }

  getProductCost(productId: string): number {
    const product = this.products.find(p => p.productId === productId);
    return product?.unitCost || 0;
  }

  getMaterialCost(index: number): number {
    const materialControl = this.materialsUsed.at(index);
    const productId = materialControl.get('productId')?.value;
    const quantity = materialControl.get('quantity')?.value || 0;

    if (productId && quantity > 0) {
      const selectedProduct = this.products.find(product => product.productId === productId);
      if (selectedProduct && selectedProduct.unitCost) {
        return selectedProduct.unitCost * quantity;
      }
    }

    return 0;
  }

  getProductStock(productId: string): number {
    const product = this.products.find(p => p.productId === productId);
    return product?.currentStock || 0;
  }

  getProductStockText(productId: string): string {
    const product = this.products.find(p => p.productId === productId);
    if (!product) return '';

    const stock = product.currentStock || 0;
    const unit = product.unitOfMeasure || '';

    if (stock === 0) {
      return 'Sin stock';
    } else if (product.minimumStock && stock <= product.minimumStock) {
      return `Stock bajo: ${stock} ${unit}`;
    } else {
      return `Stock: ${stock} ${unit}`;
    }
  }

  isProductOutOfStock(productId: string): boolean {
    const product = this.products.find(p => p.productId === productId);
    return !product || (product.currentStock || 0) === 0;
  }

  isProductLowStock(productId: string): boolean {
    const product = this.products.find(p => p.productId === productId);
    if (!product) return false;

    const stock = product.currentStock || 0;
    const minStock = product.minimumStock || 0;

    return stock > 0 && minStock > 0 && stock <= minStock;
  }

  private generateNextIncidentCode(): void {
    this.incidentsService.getAll().subscribe({
      next: (incidents) => {
        const codes = incidents
          .map(i => i.incidentCode)
          .filter(code => /^INC\d{3}$/i.test(code));
        let max = 0;
        codes.forEach(code => {
          const num = parseInt(code.replace(/INC/i, ''), 10);
          if (num > max) max = num;
        });
        const nextCode = 'INC' + (max + 1).toString().padStart(3, '0');
        this.incidentForm.get('incidentCode')?.setValue(nextCode);
        console.log('Código de incidencia generado:', nextCode);
      },
      error: (error) => {
        console.error('Error generando código de incidencia:', error);
        this.incidentForm.get('incidentCode')?.setValue('INC001');
      }
    });
  }

  /**
   * Método para guardar solo la incidencia
   */
  saveIncident(): void {
    console.log('=== saveIncident iniciado ===');
    
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      this.showErrorAlert('Por favor, complete todos los campos requeridos de la incidencia.');
      return;
    }

    this.isSavingIncident = true;
    const incidentFormValue = this.incidentForm.value;
    
    // Capturar el estado original antes de modificar isEditing (según experiencia de bug mensaje incorrecto)
    const wasEditing = this.isEditing;

    // Obtener organizationId del contexto si el campo está deshabilitado
    const organizationId = this.incidentForm.get('organizationId')?.disabled
      ? this.organizationContextService.getCurrentOrganizationId()
      : incidentFormValue.organizationId;

    if (!organizationId) {
      this.showErrorAlert('No se pudo determinar la organización. Por favor, inicie sesión nuevamente.');
      this.isSavingIncident = false;
      return;
    }

    // Procesar fecha del incidente
    let incidentDateTimestamp;
    if (this.isEditing && this.data.incident?.incidentDate) {
      incidentDateTimestamp = this.data.incident.incidentDate;
      if (incidentFormValue.incidentDate) {
        const dateObj = new Date(incidentFormValue.incidentDate);
        if (!isNaN(dateObj.getTime())) {
          incidentDateTimestamp = dateObj.getTime();
        }
      }
    } else if (incidentFormValue.incidentDate) {
      const dateObj = new Date(incidentFormValue.incidentDate);
      if (!isNaN(dateObj.getTime())) {
        incidentDateTimestamp = dateObj.getTime();
      } else {
        incidentDateTimestamp = Date.now();
        console.warn('Fecha de incidente inválida, usando fecha actual');
      }
    } else {
      incidentDateTimestamp = Date.now();
    }

    const incidentData: any = {
      incidentCategory: incidentFormValue.incidentCategory,
      incidentDate: incidentDateTimestamp,
      title: incidentFormValue.title,
      description: incidentFormValue.description,
      severity: incidentFormValue.severity,
      status: incidentFormValue.status,
      organizationId: organizationId,
      incidentCode: incidentFormValue.incidentCode,
      incidentTypeId: incidentFormValue.incidentTypeId,
      zoneId: incidentFormValue.zoneId || '',
      affectedBoxesCount: incidentFormValue.affectedBoxesCount || 0,
      reportedByUserId: incidentFormValue.reportedByUserId || '',
      assignedToUserId: incidentFormValue.assignedToUserId || '',
      resolved: incidentFormValue.resolved || false,
      ...(this.isEditing && this.data.incident?.recordStatus && { recordStatus: this.data.incident.recordStatus }),
      ...(this.isEditing && this.data.incident?.createdAt && { createdAt: this.data.incident.createdAt }),
      ...(!this.isEditing && { createdAt: Date.now() })
    };

    const incidentObservable = this.isEditing && this.data.incident?.id
      ? this.incidentsService.update(this.data.incident.id, incidentData as Incident)
      : this.incidentsService.create(incidentData as Incident);

    incidentObservable.subscribe({
      next: (response) => {
        console.log('Incidencia guardada exitosamente:', response);
        
        // Actualizar el formulario de resolución con el ID de la incidencia recién guardada
        if (!this.isEditing && response.id) {
          this.resolutionForm.patchValue({
            incidentId: response.id
          });
          
          // Marcar como guardada y actualizar datos para edición futura
          this.incidentSaved = true;
          this.data.incident = response;
          this.isEditing = true;
        }
        
        // Actualizar this.data.incident con la respuesta para reflejar cambios
        if (this.data.incident) {
          this.data.incident = { ...this.data.incident, ...response };
        }
        
        this.isSavingIncident = false;
        
        // Usar estado original para mensaje correcto (según experiencia de bug)
        const successMessage = wasEditing 
          ? 'Incidencia actualizada correctamente' 
          : 'Incidencia guardada correctamente. Ahora puede agregar los detalles de resolución.';
        
        this.showSuccessAlert(successMessage);
      },
      error: (error) => {
        console.error('Error al guardar la incidencia:', error);
        this.showErrorAlert('Error al guardar la incidencia.');
        this.isSavingIncident = false;
      }
    });
  }

  /**
   * Método para guardar solo la resolución
   */
  saveResolution(): void {
    console.log('=== saveResolution iniciado ===');
    console.log('🔍 Debugging estado del formulario de resolución:');
    console.log('- resolutionForm.valid:', this.resolutionForm.valid);
    console.log('- resolutionForm.errors:', this.resolutionForm.errors);
    console.log('- isSavingResolution:', this.isSavingResolution);
    console.log('- incidentSaved:', this.incidentSaved);
    console.log('- isEditing:', this.isEditing);
    
    // Debug detallado de cada control del formulario
    Object.keys(this.resolutionForm.controls).forEach(key => {
      const control = this.resolutionForm.get(key);
      if (!control?.valid) {
        console.error(`❌ Campo inválido: ${key}`, {
          valor: control?.value,
          errores: control?.errors,
          valido: control?.valid
        });
      }
    });
    
    // Debug de materiales específicamente
    if (this.materialsUsed && this.materialsUsed.length > 0) {
      console.log('📋 Debug de materiales:');
      this.materialsUsed.controls.forEach((materialControl, index) => {
        console.log(`Material ${index + 1}:`, {
          valido: materialControl.valid,
          errores: materialControl.errors,
          valor: materialControl.value
        });
      });
    }
    
    // Verificar que se haya guardado la incidencia primero
    if (!this.incidentSaved && !this.isEditing) {
      this.showErrorAlert('Debe guardar la incidencia primero antes de agregar la resolución.');
      return;
    }

    if (this.resolutionForm.invalid) {
      this.resolutionForm.markAllAsTouched();
      this.showErrorAlert('Por favor, complete todos los campos requeridos de la resolución.');
      return;
    }

    // Validar stock disponible
    const materialsUsed = this.resolutionForm.get('materialsUsed')?.value || [];
    const stockErrors: string[] = [];

    materialsUsed.forEach((material: any) => {
      const productId = material.productId;
      const quantityUsed = material.quantity || 0;

      if (productId && quantityUsed > 0) {
        const product = this.products.find(p => p.productId === productId);
        if (product) {
          const currentStock = product.currentStock || 0;
          if (quantityUsed > currentStock) {
            stockErrors.push(`${product.productName}: Cantidad solicitada (${quantityUsed}) excede stock disponible (${currentStock})`);
          }
        }
      }
    });

    if (stockErrors.length > 0) {
      const errorMessage = 'Stock insuficiente:\n' + stockErrors.join('\n');
      this.showErrorAlert(errorMessage);
      return;
    }

    this.isSavingResolution = true;

    // Procesar fecha de resolución
    let resolutionDateTimestamp;
    if (this.resolutionForm.value.resolutionDate) {
      const dateObj = new Date(this.resolutionForm.value.resolutionDate);
      if (!isNaN(dateObj.getTime())) {
        resolutionDateTimestamp = dateObj.getTime();
      } else {
        resolutionDateTimestamp = Date.now();
        console.warn('Fecha de resolución inválida, usando fecha actual');
      }
    } else {
      resolutionDateTimestamp = Date.now();
    }

    const resolutionData: IncidentResolution = {
      ...this.resolutionForm.value,
      incidentId: this.data.incident?.id!,
      resolutionDate: resolutionDateTimestamp
    };

    this.createOrUpdateResolution(resolutionData).subscribe({
      next: (response) => {
        console.log('Resolución guardada exitosamente:', response);
        
        // Verificar el estado del checkbox "Incidencia resuelta" (respetando según experiencia de bug crítico)
        const isResolvedChecked = this.incidentForm.get('resolved')?.value === true;
        console.log('Estado del checkbox "Incidencia resuelta":', isResolvedChecked);
        
        // Solo actualizar el estado si el usuario marcó el checkbox como resuelto
        if (this.data.incident?.id && isResolvedChecked) {
          const updatedIncidentData = {
            ...this.data.incident,
            resolved: true,
            status: 'RESOLVED'
          };
          
          this.incidentsService.update(this.data.incident.id, updatedIncidentData as Incident).subscribe({
            next: (updatedIncident) => {
              console.log('Estado de incidencia actualizado a resuelto');
              // Actualizar los datos locales para reflejar los cambios
              if (this.data.incident) {
                this.data.incident = { ...this.data.incident, ...updatedIncident };
              }
            },
            error: (error) => {
              console.warn('Error actualizando estado de incidencia:', error);
            }
          });
        } else if (this.data.incident?.id && !isResolvedChecked) {
          console.log('📝 Resolución guardada pero checkbox no marcado - manteniendo estado actual de la incidencia');
          console.log('ℹ️ Los detalles de resolución permanecen disponibles independientemente del estado del checkbox');
        }
        
        this.isSavingResolution = false;
        const message = this.existingResolutionId ? 'Resolución actualizada correctamente' : 'Resolución guardada correctamente';
        this.showSuccessAlert(message);
      },
      error: (error) => {
        console.error('Error al guardar la resolución:', error);
        this.showErrorAlert('Error al guardar la resolución.');
        this.isSavingResolution = false;
      }
    });
  }

  /**
   * Método para finalizar y cerrar el modal
   */
  finishAndClose(): void {
    // Devolver la incidencia actualizada para que la tabla principal se refresque
    this.dialogRef.close(this.data.incident);
  }

  loadIncidentTypes(): void {
    this.isLoadingTypes = true;
    console.log('Cargando todos los tipos de incidencias (sin filtrar por estado)...');
    this.incidentTypesService.getAll().subscribe({
      next: (types) => {
        console.log('Tipos de incidencias cargados:', types);
        this.incidentTypes = types;
        this.isLoadingTypes = false;
      },
      error: (error) => {
        console.error('Error cargando tipos de incidencias:', error);
        this.showErrorAlert('Error cargando tipos de incidencias');
        this.isLoadingTypes = false;
      }
    });
  }

  loadClientUsers(): void {
    this.isLoadingUsers = true;
    console.log('🔍 Cargando usuarios clientes usando ClientsService...');

    const currentOrgId = this.organizationContextService.getCurrentOrganizationId();

    if (!currentOrgId) {
      console.error('❌ No se pudo obtener el organizationId del contexto');
      this.isLoadingUsers = false;
      return;
    }

    this.clientsService.getAllClients(currentOrgId).subscribe({
      next: (clients: ClientData[]) => {
        console.log('✅ Clientes cargados exitosamente desde ClientsService:');
        console.log('📊 Cantidad de clientes:', clients.length);
        console.log('📋 Lista completa de clientes:', clients);

        // Convertir ClientData a UserResponseDTO para mantener compatibilidad
        this.clientUsers = clients.map(client => ({
          id: client.id,
          organizationId: client.organization.organizationId,
          userCode: client.userCode,
          documentType: client.documentType as any,
          documentNumber: client.documentNumber,
          firstName: client.firstName,
          lastName: client.lastName,
          fullName: `${client.firstName} ${client.lastName}`,
          email: client.email,
          phone: client.phone,
          streetAddress: client.address,
          streetId: client.street?.streetId || '',
          zoneId: client.zone?.zoneId || '',
          status: client.status as any,
          registrationDate: client.createdAt,
          lastLogin: client.updatedAt,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          roles: client.roles as any[],
          username: client.userCode
        }));

        console.log('🔄 Clientes convertidos a UserResponseDTO:', this.clientUsers);

        this.isLoadingUsers = false;

        if (clients.length === 0) {
          console.warn('⚠️ No se encontraron clientes en la respuesta del ClientsService');
        }
      },
      error: (error: any) => {
        console.error('❌ Error cargando clientes desde ClientsService:', error);
        console.error('🔍 Detalles del error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        this.showErrorAlert('Error cargando clientes: ' + (error.message || 'Error desconocido'));
        this.isLoadingUsers = false;
      }
    });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    console.log('🔍 Cargando productos del inventario...');
    this.inventoryService.getProducts().subscribe({
      next: (products) => {
        console.log('✅ Productos cargados exitosamente desde InventoryService:');
        console.log('📊 Cantidad de productos:', products.length);
        console.log('📋 Lista completa de productos:', products);

        // Filtrar solo productos activos
        this.products = products.filter(product => product.status === 'ACTIVO');

        console.log('🔄 Productos activos asignados:', this.products);

        this.isLoadingProducts = false;

        if (this.products.length === 0) {
          console.warn('⚠️ No se encontraron productos activos en el inventario');
        } else {
          // Si ya hay materiales cargados (modo edición), recalcular el costo total
          setTimeout(() => {
            if (this.materialsUsed.length > 0) {
              this.calculateTotalCost();
              // IMPORTANTE: Reconfigurar validadores de materiales ahora que los productos están cargados
              this.reconfigureMaterialValidators();
            }
          }, 100);
        }
      },
      error: (error) => {
        console.error('❌ Error cargando productos desde InventoryService:', error);
        console.error('🔍 Detalles del error:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          url: error.url
        });
        this.showErrorAlert('Error cargando productos del inventario: ' + (error.message || 'Error desconocido'));
        this.isLoadingProducts = false;
      }
    });
  }

  private toISOStringLocal(dateStr: string): string | undefined {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return undefined;
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toISOString();
  }

  onButtonClick(): void {
    console.log('=== Botón clickeado ===');
    console.log('Formulario de incidencia válido:', this.incidentForm.valid);
    console.log('Errores del formulario de incidencia:', this.incidentForm.errors);
    console.log('Valores del formulario de incidencia:', this.incidentForm.value);

    if (this.showResolutionDetails) {
      console.log('Resolución mostrada. Formulario de resolución válido:', this.resolutionForm.valid);
      console.log('Errores del formulario de resolución:', this.resolutionForm.errors);
      console.log('Valores del formulario de resolución:', this.resolutionForm.value);
    }

    // Check main incident form validity
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      this.showErrorAlert('Por favor, complete todos los campos requeridos de la incidencia.');
      return;
    }

    // Check resolution form validity if visible
    if (this.showResolutionDetails && this.resolutionForm.invalid) {
      this.resolutionForm.markAllAsTouched();
      this.showErrorAlert('Por favor, complete todos los campos requeridos de la resolución.');

      // Detailed logging for resolution form errors
      console.error('=== Errores detallados del formulario de resolución ===');
      console.error('Resolution Form overall errors:', this.resolutionForm.errors);
      Object.keys(this.resolutionForm.controls).forEach(key => {
        const control = this.resolutionForm.get(key);
        console.error(`${key}:`, {
          valid: control?.valid,
          errors: control?.errors,
          value: control?.value
        });
      });
      console.trace('Error triggered from resolution form validation');
      return;
    }

    // Validar stock disponible antes de proceder
    if (this.showResolutionDetails && this.resolutionForm.valid) {
      const materialsUsed = this.resolutionForm.get('materialsUsed')?.value || [];
      const stockErrors: string[] = [];

      materialsUsed.forEach((material: any, index: number) => {
        const productId = material.productId;
        const quantityUsed = material.quantity || 0;

        if (productId && quantityUsed > 0) {
          const product = this.products.find(p => p.productId === productId);
          if (product) {
            const currentStock = product.currentStock || 0;
            if (quantityUsed > currentStock) {
              stockErrors.push(`${product.productName}: Cantidad solicitada (${quantityUsed}) excede stock disponible (${currentStock})`);
            }
          }
        }
      });

      if (stockErrors.length > 0) {
        const errorMessage = 'Stock insuficiente:\n' + stockErrors.join('\n');
        this.showErrorAlert(errorMessage);
        return;
      }
    }

    this.onSubmit(); // If all forms are valid, proceed to submit
  }

  onSubmit(): void {
    console.log('=== onSubmit iniciado ===');
    console.log('Formulario de incidencia válido:', this.incidentForm.valid);
    console.log('Errores del formulario de incidencia:', this.incidentForm.errors);
    console.log('Valores del formulario de incidencia:', this.incidentForm.value);

    // This check is already done in onButtonClick, but as a safeguard:
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      this.showErrorAlert('Por favor, complete todos los campos requeridos de la incidencia.');
      return;
    }

    // This check is already done in onButtonClick, but as a safeguard:
    if (this.showResolutionDetails && this.resolutionForm.invalid) {
      this.resolutionForm.markAllAsTouched();
      this.showErrorAlert('Por favor, complete todos los campos requeridos de la resolución.');
      return;
    }

    const incidentFormValue = this.incidentForm.value;

    // Obtener organizationId del contexto si el campo está deshabilitado
    const organizationId = this.incidentForm.get('organizationId')?.disabled
      ? this.organizationContextService.getCurrentOrganizationId()
      : incidentFormValue.organizationId;

    // Validar que tenemos organizationId
    if (!organizationId) {
      this.showErrorAlert('No se pudo determinar la organización. Por favor, inicie sesión nuevamente.');
      return;
    }

    // Asegurarse de que la fecha del incidente sea un timestamp válido
    let incidentDateTimestamp;
    if (this.isEditing && this.data.incident?.incidentDate) {
      // If editing, try to use the existing incidentDate first
      incidentDateTimestamp = this.data.incident.incidentDate;
      // If the form's incidentDate is provided and valid, prioritize it
      if (incidentFormValue.incidentDate) {
        const dateObj = new Date(incidentFormValue.incidentDate);
        if (!isNaN(dateObj.getTime())) {
          incidentDateTimestamp = dateObj.getTime();
        } else {
          console.warn('Fecha de incidente inválida en formulario de edición, manteniendo fecha original.');
        }
      }
    } else if (incidentFormValue.incidentDate) {
      // For new incidents or if not editing, use the form's incidentDate
      const dateObj = new Date(incidentFormValue.incidentDate);
      if (!isNaN(dateObj.getTime())) {
        incidentDateTimestamp = dateObj.getTime();
      } else {
        incidentDateTimestamp = Date.now();
        console.warn('Fecha de incidente inválida, usando fecha actual');
      }
    } else {
      // Fallback for new incidents or if no date is provided
      incidentDateTimestamp = Date.now();
      console.warn('No se proporcionó fecha de incidente, usando fecha actual');
    }

    // Determinar el estado basándose únicamente en el checkbox del usuario (según experiencia de bug crítico)
    const isResolved = this.incidentForm.get('resolved')?.value === true;
    
    // Solo actualizar status a RESOLVED si el usuario marcó explícitamente el checkbox
    const finalStatus = isResolved ? 'RESOLVED' : incidentFormValue.status;
    
    const incidentData: any = {
      incidentCategory: incidentFormValue.incidentCategory,
      incidentDate: incidentDateTimestamp,
      title: incidentFormValue.title,
      description: incidentFormValue.description,
      severity: incidentFormValue.severity,
      status: finalStatus, // Usar el status final calculado
      organizationId: organizationId,
      incidentCode: incidentFormValue.incidentCode,
      incidentTypeId: incidentFormValue.incidentTypeId,
      zoneId: incidentFormValue.zoneId || '',
      affectedBoxesCount: incidentFormValue.affectedBoxesCount || 0,
      reportedByUserId: incidentFormValue.reportedByUserId || '',
      assignedToUserId: incidentFormValue.assignedToUserId || '',
      resolved: isResolved,
      ...(this.isEditing && this.data.incident?.recordStatus && { recordStatus: this.data.incident.recordStatus }),
      ...(this.isEditing && this.data.incident?.createdAt && { createdAt: this.data.incident.createdAt }),
      ...(!this.isEditing && { createdAt: Date.now() })
    };
    
    console.log('Estado resolved determinado por checkbox del usuario:', isResolved);
    console.log('Status del formulario original:', incidentFormValue.status);
    console.log('Status final aplicado:', finalStatus);

    console.log('showResolutionDetails:', this.showResolutionDetails);
    console.log('resolutionForm.valid:', this.resolutionForm.valid);
    console.log('checkbox resolved marcado:', incidentFormValue.resolved);
    console.log('organizationId usado:', organizationId);
    console.log('incidentData before submission:', incidentData);

    const incidentObservable = this.isEditing && this.data.incident?.id
      ? this.incidentsService.update(this.data.incident.id, incidentData as Incident)
      : this.incidentsService.create(incidentData as Incident);

    let finalObservable: Observable<any>;

    // Solo crear/actualizar resolución si el usuario marcó la incidencia como resuelta Y tiene datos de resolución válidos
    if (isResolved && this.showResolutionDetails && this.resolutionForm.valid) {
      finalObservable = incidentObservable.pipe(
        concatMap(incidentResponse => {
          // Procesar la fecha de resolución
          let resolutionDateTimestamp;
          if (this.resolutionForm.value.resolutionDate) {
            const dateObj = new Date(this.resolutionForm.value.resolutionDate);
            if (!isNaN(dateObj.getTime())) {
              resolutionDateTimestamp = dateObj.getTime();
            } else {
              resolutionDateTimestamp = Date.now();
              console.warn('Fecha de resolución inválida, usando fecha actual');
            }
          } else {
            resolutionDateTimestamp = Date.now();
          }

          const resolutionData: IncidentResolution = {
            ...this.resolutionForm.value,
            incidentId: incidentResponse.id!,
            resolutionDate: resolutionDateTimestamp
          };
          return this.createOrUpdateResolution(resolutionData).pipe(
            concatMap(resolutionResponse => {
              console.log('Resolución procesada correctamente:', resolutionResponse);
              return of(incidentResponse);
            })
          );
        })
      );
    } else {
      finalObservable = incidentObservable;
    }

    finalObservable.subscribe({
      next: (response) => {
        let successMessage = this.isEditing ? 'Incidencia actualizada correctamente' : 'Incidencia guardada correctamente';
        if (isResolved && this.showResolutionDetails && this.resolutionForm.valid) {
          if (this.existingResolutionId) {
            successMessage = 'Incidencia y resolución actualizadas correctamente';
          } else {
            successMessage = this.isEditing
              ? 'Incidencia actualizada y resolución creada correctamente'
              : 'Incidencia y resolución guardadas correctamente';
          }
        }
        this.showSuccessAlert(successMessage);
        this.dialogRef.close(response);
      },
      error: (error) => {
        console.error('Error al guardar la incidencia o la resolución:', error);
        this.showErrorAlert('Error al guardar la incidencia o la resolución.');
      }
    });
  }

  // Method to be used internally for chaining - handles both create and update
  private createOrUpdateResolution(resolutionData: IncidentResolution): Observable<IncidentResolution> {
    const resolutionObservable = this.existingResolutionId
      ? this.resolutionService.update(this.existingResolutionId, resolutionData)
      : this.resolutionService.create(resolutionData);

    console.log(this.existingResolutionId ? '📝 Actualizando resolución existente...' : '🆕 Creando nueva resolución...');
    console.log('Resolution data:', resolutionData);

    return resolutionObservable.pipe(
      concatMap(resolutionResponse => {
        console.log(this.existingResolutionId ? '✅ Resolución actualizada:' : '✅ Resolución creada:', resolutionResponse);

        if (!this.existingResolutionId) {
          // Nueva resolución: actualizar stock normalmente
          return this.updateProductStock().pipe(
            concatMap(() => of(resolutionResponse))
          );
        } else {
          // Resolución existente: calcular diferencias y ajustar stock
          return this.updateProductStockForEdit(resolutionData.materialsUsed || []).pipe(
            concatMap(() => of(resolutionResponse))
          );
        }
      }),
      catchError(error => {
        console.error('Error en createOrUpdateResolution:', error);
        const errorMessage = this.existingResolutionId
          ? 'Error al actualizar la resolución.'
          : 'Error al crear la resolución.';
        this.showErrorAlert(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Actualiza el stock de los productos utilizados en la resolución
   */
  private updateProductStock(): Observable<any> {
    const materialsUsed = this.resolutionForm.get('materialsUsed')?.value || [];

    if (materialsUsed.length === 0) {
      return of(null); // No hay materiales que actualizar
    }

    console.log('🔄 Actualizando stock de productos utilizados...', materialsUsed);

    // Crear observables para actualizar cada producto
    const updateObservables = materialsUsed.map((material: any) => {
      const productId = material.productId;
      const quantityUsed = material.quantity || 0;

      if (!productId || quantityUsed <= 0) {
        return of(null); // Skip invalid materials
      }

      const product = this.products.find(p => p.productId === productId);
      if (!product) {
        console.warn(`⚠️ Producto no encontrado: ${productId}`);
        return of(null);
      }

      const currentStock = product.currentStock || 0;
      const newStock = Math.max(0, currentStock - quantityUsed); // Evitar stock negativo

      console.log(`📦 Actualizando stock de ${product.productName}:`, {
        stockAnterior: currentStock,
        cantidadUsada: quantityUsed,
        stockNuevo: newStock
      });

      // Preparar datos para actualizar el producto
      const updatedProductData = {
        organizationId: product.organizationId,
        productCode: product.productCode,
        productName: product.productName,
        categoryId: product.categoryId,
        unitOfMeasure: product.unitOfMeasure,
        minimumStock: product.minimumStock,
        maximumStock: product.maximumStock,
        currentStock: newStock, // Nuevo stock actualizado
        unitCost: product.unitCost,
        status: product.status
      };

      return this.inventoryService.updateProduct(productId, updatedProductData).pipe(
        catchError(error => {
          console.error(`❌ Error actualizando stock del producto ${product.productName}:`, error);
          // No fallar completamente si un producto no se puede actualizar
          return of(null);
        })
      );
    });

    // Ejecutar todas las actualizaciones en paralelo
    return new Observable(observer => {
      Promise.all(updateObservables.map((obs: Observable<any>) => obs.toPromise()))
        .then(results => {
          const successfulUpdates = results.filter(result => result !== null).length;
          console.log(`✅ Stock actualizado exitosamente para ${successfulUpdates} productos`);

          // Recargar la lista de productos para mantener la sincronización
          this.loadProducts();

          observer.next(results);
          observer.complete();
        })
        .catch(error => {
          console.error('❌ Error actualizando stock de productos:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Actualiza el stock considerando las diferencias entre los materiales originales y los nuevos al editar
   */
  private updateProductStockForEdit(newMaterialsUsed: any[]): Observable<any> {
    console.log('🔄 Calculando diferencias en stock para edición...');
    console.log('Materiales originales:', this.originalMaterialsUsed);
    console.log('Materiales nuevos:', newMaterialsUsed);

    if (this.originalMaterialsUsed.length === 0 && newMaterialsUsed.length === 0) {
      console.log('✅ No hay cambios en materiales');
      return of(null);
    }

    // Calcular diferencias por producto
    const stockChanges = new Map<string, number>();

    // Procesar materiales originales (devolver al stock)
    this.originalMaterialsUsed.forEach((originalMaterial: any) => {
      const productId = originalMaterial.productId;
      const originalQuantity = originalMaterial.quantity || 0;

      if (productId && originalQuantity > 0) {
        stockChanges.set(productId, (stockChanges.get(productId) || 0) + originalQuantity);
      }
    });

    // Procesar materiales nuevos (restar del stock)
    newMaterialsUsed.forEach((newMaterial: any) => {
      const productId = newMaterial.productId;
      const newQuantity = newMaterial.quantity || 0;

      if (productId && newQuantity > 0) {
        stockChanges.set(productId, (stockChanges.get(productId) || 0) - newQuantity);
      }
    });

    console.log('📊 Cambios calculados en stock:', Array.from(stockChanges.entries()));

    // Filtrar solo los productos que tienen cambios
    const productsToUpdate = Array.from(stockChanges.entries()).filter(([_, change]) => change !== 0);

    if (productsToUpdate.length === 0) {
      console.log('✅ No hay cambios netos en el stock');
      return of(null);
    }

    // Crear observables para actualizar cada producto
    const updateObservables = productsToUpdate.map(([productId, stockChange]) => {
      const product = this.products.find(p => p.productId === productId);
      if (!product) {
        console.warn(`⚠️ Producto no encontrado: ${productId}`);
        return of(null);
      }

      const currentStock = product.currentStock || 0;
      const newStock = Math.max(0, currentStock + stockChange); // stockChange puede ser positivo (devolver) o negativo (restar)

      console.log(`📦 Ajustando stock de ${product.productName}:`, {
        stockAnterior: currentStock,
        cambio: stockChange,
        stockNuevo: newStock,
        accion: stockChange > 0 ? 'Devolver al stock' : 'Restar del stock'
      });

      // Preparar datos para actualizar el producto
      const updatedProductData = {
        organizationId: product.organizationId,
        productCode: product.productCode,
        productName: product.productName,
        categoryId: product.categoryId,
        unitOfMeasure: product.unitOfMeasure,
        minimumStock: product.minimumStock,
        maximumStock: product.maximumStock,
        currentStock: newStock, // Nuevo stock ajustado
        unitCost: product.unitCost,
        status: product.status
      };

      return this.inventoryService.updateProduct(productId, updatedProductData).pipe(
        catchError(error => {
          console.error(`❌ Error ajustando stock del producto ${product.productName}:`, error);
          return of(null);
        })
      );
    });

    // Ejecutar todas las actualizaciones en paralelo
    return new Observable(observer => {
      Promise.all(updateObservables.map((obs: Observable<any>) => obs.toPromise()))
        .then(results => {
          const successfulUpdates = results.filter(result => result !== null).length;
          console.log(`✅ Stock ajustado exitosamente para ${successfulUpdates} productos`);

          // Recargar la lista de productos para mantener la sincronización
          this.loadProducts();

          observer.next(results);
          observer.complete();
        })
        .catch(error => {
          console.error('❌ Error ajustando stock de productos:', error);
          observer.error(error);
        });
    });
  }

  onCancel(): void {
    // Si se hicieron cambios, devolver los datos para refrescar la tabla
    const hasChanges = this.incidentSaved || this.isEditing;
    this.dialogRef.close(hasChanges ? this.data.incident : null);
  }

  private formatDateInput(date: Date): string {
    // Verificar que la fecha sea válida
    if (!date || isNaN(date.getTime())) {
      console.warn('Fecha inválida proporcionada a formatDateInput:', date);
      // Devolver la fecha actual formateada
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateInputString(date: any): string | null {
    if (!date) return null;

    try {
      if (date instanceof Date) {
        // Verificar que la fecha sea válida
        if (isNaN(date.getTime())) {
          console.warn('Fecha inválida (objeto Date) proporcionada a toDateInputString:', date);
          return this.formatDateInput(new Date());
        }
        return this.formatDateInput(date);
      } else if (typeof date === 'number') {
        // Verificar que el timestamp sea válido (mayor que 0 y no NaN)
        if (isNaN(date) || date <= 0) {
          console.warn('Timestamp inválido proporcionado a toDateInputString:', date);
          return this.formatDateInput(new Date());
        }
        return this.formatDateInput(new Date(date));
      } else if (typeof date === 'string') {
        // Intentar convertir la cadena a fecha
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          console.warn('Cadena de fecha inválida proporcionada a toDateInputString:', date);
          return this.formatDateInput(new Date());
        }
        return this.formatDateInput(dateObj);
      }
    } catch (error) {
      console.error('Error al procesar fecha en toDateInputString:', error);
      return this.formatDateInput(new Date());
    }

    return null;
  }

  private adaptIncidentForForm(incident: Incident | null): any {
    if (!incident) return null;
    return {
      ...incident,
      incidentDate: this.toDateInputString(incident.incidentDate)
    };
  }

  getSelectedIncidentType(): IncidentType | undefined {
    return this.incidentTypes.find(type => type.id === this.incidentForm.get('incidentTypeId')?.value);
  }

  getPriorityLabel(priority: string | undefined): string {
    switch (priority) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      case 'CRITICAL': return 'Crítica';
      default: return priority || '';
    }
  }

  private showSuccessAlert(message: string): void {
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: message,
      confirmButtonColor: '#4CAF50',
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        actions: 'swal2-actions',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel',
        icon: 'swal2-icon'
      }
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonColor: '#F44336',
      customClass: {
        popup: 'swal2-popup',
        title: 'swal2-title',
        htmlContainer: 'swal2-html-container',
        actions: 'swal2-actions',
        confirmButton: 'swal2-confirm',
        cancelButton: 'swal2-cancel'
      }
    });
  }
}
