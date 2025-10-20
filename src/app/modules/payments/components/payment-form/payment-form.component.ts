import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { Payment, PaymentCreate, PaymentDetail, PaymentUpdate, PaymentDRequest, PaymentResponse } from '../../../../core/models/payment.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, FormsModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css'
})
export class PaymentFormComponent implements OnInit {
  paymentForm!: FormGroup;
  isEditMode = false;
  paymentId: string | null = null;
  loading = false;
  submitting = false;
  showSuccessAlert = false;
  showErrorAlert = false;

  organizationName: string = '';
  users: any[] = [];
  userWaterBoxes: any[] = [];

  // Searchable dropdown properties
  searchTerm: string = '';
  selectedUser: any = null;
  filteredUsers: any[] = [];
  showDropdown: boolean = false;

  // Conceptos y montos predefinidos
  concepts = [
    { value: 'SERVICIO_AGUA', label: 'Servicio de Agua', amount: 10 },
    { value: 'REPOSICION', label: 'Reposición', amount: 30 }
  ];

  // Meses del año
  months = [
    { value: 1, name: 'Enero' },
    { value: 2, name: 'Febrero' },
    { value: 3, name: 'Marzo' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Mayo' },
    { value: 6, name: 'Junio' },
    { value: 7, name: 'Julio' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Septiembre' },
    { value: 10, name: 'Octubre' },
    { value: 11, name: 'Noviembre' },
    { value: 12, name: 'Diciembre' }
  ];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private organizationContextService: OrganizationContextService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.paymentForm = this.createForm();
    this.loadAllUsers();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.paymentId = params['id'];
        this.loadPayment();
      } else {
        this.generatePaymentCode();
      }
    });

    // Listener para cambios en waterBoxId para debugging
    this.paymentForm.get('waterBoxId')!.valueChanges.subscribe(value => {
      console.log('waterBoxId changed to:', value);
    });
  }

  private loadAllUsers(): void {
    console.log('Starting loadAllUsers...');
    
    // Check if OrganizationContextService is available
    console.log('OrganizationContextService:', this.organizationContextService);
    console.log('Has organization context:', this.organizationContextService.hasOrganizationContext());
    
    // Get organizationId from OrganizationContextService
    const organizationId = this.organizationContextService.getCurrentOrganizationId();
    console.log('Organization ID from context:', organizationId);
    
    if (!organizationId) {
      console.error('No organization ID available');
      console.log('Organization context info:', this.organizationContextService.getContextInfo());
      
      // Try alternative approach: check if there's a default organization or load all users without organization filter
      console.log('Attempting to load users without organization filter as fallback...');
      
      // Try to get users from the original endpoint as fallback
      this.loadUsersFromOriginalEndpoint();
      return;
    }
    
    console.log('Loading users for organization:', organizationId);
    this.paymentService.getAllUsers(organizationId).subscribe({
      next: users => {
        console.log('All users loaded successfully:', users);
        console.log('Number of users loaded:', users?.length || 0);
        
        this.users = users || [];
        this.filteredUsers = this.users; // Initialize filtered users with all users

        // Debug: mostrar estructura de algunos usuarios
        if (this.users.length > 0) {
          console.log('Sample user structure:', this.users[0]);
          console.log('User properties:', Object.keys(this.users[0]));
        } else {
          console.log('No users found for this organization');
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        
        // Try fallback approach
        console.log('Trying fallback approach...');
        this.loadUsersFromOriginalEndpoint();
      }
    });
  }

  private loadUsersFromOriginalEndpoint(): void {
    console.log('Loading users from original endpoint as fallback...');
    
    // Use UserService directly if it has a method to get all users
    // This is a fallback in case the organization-scoped endpoint doesn't work
    
    Swal.fire({
      title: 'Información',
      text: 'No se pudo cargar usuarios con el contexto de organización. ¿Desea continuar sin filtro de organización?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Here you would implement fallback user loading
        console.log('User chose to continue without organization filter');
        // You might need to implement a fallback method or use a different service
      }
    });
  }

  // Searchable dropdown methods
  filterUsers(): void {
    console.log('Filtering users with term:', this.searchTerm);
    if (!this.searchTerm.trim()) {
      this.filteredUsers = this.users;
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const matches = fullName.includes(searchLower) || email.includes(searchLower);
        console.log(`User ${fullName} (${email}) matches: ${matches}`);
        return matches;
      });
    }
    console.log('Filtered users:', this.filteredUsers);
  }

  onFocus(): void {
    console.log('Input focused, showing dropdown');
    this.showDropdown = true;
    this.filterUsers();
  }

  selectUser(user: any): void {
    console.log('User selected:', user);
    this.selectedUser = user;
    this.searchTerm = `${user.firstName || ''} ${user.lastName || ''}`;
    this.paymentForm.get('userId')?.setValue(user.id);
    this.showDropdown = false;
    
    // Immediately populate basic user data from the selected user
    console.log('Populating basic user data immediately...');
    this.paymentForm.get('clientInfo')?.patchValue({
      documentType: user.documentType || '',
      documentNumber: user.documentNumber || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      email: user.email || '',
      address: {
        localityName: user.zoneName || user.locality || '',
        streetName: user.streetAddress || user.address || ''
      }
    });
    
    // Trigger the existing user selection logic for additional data
    this.onUserSelection(user.id);
  }

  onBlur(): void {
    // Delay hiding dropdown to allow for click events
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  clearUserSelection(): void {
    this.selectedUser = null;
    this.searchTerm = '';
    this.paymentForm.get('userId')?.reset();
    this.paymentForm.get('organizationId')?.reset();
    this.paymentForm.get('waterBoxId')?.reset();
    this.organizationName = '';
    this.userWaterBoxes = [];
    this.paymentForm.get('clientInfo')?.reset();
  }

  private onUserSelection(userId: string): void {
    console.log('User ID changed to:', userId);
    if (userId) {
      // Get organizationId from OrganizationContextService
      const organizationId = this.organizationContextService.getCurrentOrganizationId();
      
      if (!organizationId) {
        console.error('No organization ID available for user selection');
        console.log('Trying to get organizationId from current user context...');
        
        // Try to get organization ID from the selected user if available
        if (this.selectedUser && this.selectedUser.organizationId) {
          const userOrgId = this.selectedUser.organizationId;
          console.log('Using organization ID from selected user:', userOrgId);
          this.paymentForm.get('organizationId')?.setValue(userOrgId);
          this.onUserSelectionWithOrgId(userId, userOrgId);
          return;
        }
        
        Swal.fire('Error', 'No se pudo obtener el ID de la organización.', 'error');
        return;
      }
      
      console.log('Using organization ID from context:', organizationId);
      this.onUserSelectionWithOrgId(userId, organizationId);
    } else {
      console.log('No user selected');
      this.clearUserData();
    }
  }

  private onUserSelectionWithOrgId(userId: string, organizationId: string): void {
    console.log('Loading user data with userId:', userId, 'and organizationId:', organizationId);
    
    // Set organization ID in form
    this.paymentForm.get('organizationId')?.setValue(organizationId);
    
    // Usar el nuevo método que incluye la organización con zonas
    console.log('Calling getUserWithOrganization...');
    this.paymentService.getUserWithOrganization(userId, organizationId).subscribe({
      next: (userData) => {
        console.log('User with organization data received:', userData);
        console.log('userData structure:', JSON.stringify(userData, null, 2));

        // Update organization name if available
        if (userData.organization) {
          this.organizationName = userData.organization.organizationName || 'Organización desconocida';
          console.log('Organization name set to:', this.organizationName);
        } else {
          console.log('No organization data found in response');
        }

        // Update client info with detailed data from API
        const clientInfo = {
          documentType: userData.documentType || '',
          documentNumber: userData.documentNumber || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          email: userData.email || '',
          address: {
            localityName: '',
            streetName: userData.streetAddress || ''
          }
        };

        // Buscar la zona correspondiente
        if (userData.organization && userData.organization.zones && userData.zoneId) {
          const zone = userData.organization.zones.find((z: any) => z.zoneId === userData.zoneId);
          if (zone) {
            clientInfo.address.localityName = zone.zoneName;
          }
        }

        console.log('Updating clientInfo with:', clientInfo);
        this.paymentForm.get('clientInfo')?.patchValue(clientInfo);
      },
      error: (error) => {
        console.error('Error loading user with organization:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error
        });
        
        this.organizationName = 'Error al cargar organización';
        
        // Show detailed error message
        const errorMessage = error.status === 404 
          ? 'Usuario no encontrado en la organización'
          : error.status === 0
          ? 'No se puede conectar con el servidor'
          : 'No se pudo cargar la información del usuario';
          
        Swal.fire('Error', errorMessage, 'error');
      }
    });

    // Cargar las cajas de agua del usuario
    console.log('Attempting to load water boxes for user:', userId);
    this.paymentService.getUserWithWaterBoxes(userId, organizationId).subscribe({
      next: (userWaterBoxesData: any) => {
        console.log('User with water boxes data received:', userWaterBoxesData);
        
        // Verificar si tenemos datos válidos
        if (userWaterBoxesData && userWaterBoxesData.waterBoxes && userWaterBoxesData.waterBoxes.length > 0) {
          console.log('Water boxes found:', userWaterBoxesData.waterBoxes);
          
          // Almacenar todas las cajas de agua del usuario
          this.userWaterBoxes = userWaterBoxesData.waterBoxes;
          
          // Tomar la primera caja de agua activa o la primera disponible
          const activeWaterBox = userWaterBoxesData.waterBoxes.find((box: any) => 
            box.assignmentStatus === 'ACTIVE'
          ) || userWaterBoxesData.waterBoxes[0];
          
          console.log('Selected water box:', activeWaterBox);
          
          if (activeWaterBox && activeWaterBox.waterBoxCode) {
            console.log('Setting water box code to:', activeWaterBox.waterBoxCode);
            this.paymentForm.get('waterBoxId')?.setValue(activeWaterBox.waterBoxCode);
            console.log('Water box code set successfully');
            
            // Verificar que el valor se estableció correctamente
            setTimeout(() => {
              const currentValue = this.paymentForm.get('waterBoxId')?.value;
              console.log('Current waterBoxId value after setting:', currentValue);
              
              // Si el valor no se estableció, intentar de nuevo
              if (!currentValue) {
                console.log('Value not set, trying again...');
                this.paymentForm.get('waterBoxId')?.setValue(activeWaterBox.waterBoxCode);
              }
            }, 100);
          } else {
            console.log('No valid water box code found in:', activeWaterBox);
            this.paymentForm.get('waterBoxId')?.reset();
          }
        } else {
          console.log('No water boxes found for user. Data structure:', userWaterBoxesData);
          this.userWaterBoxes = [];
          this.paymentForm.get('waterBoxId')?.reset();
        }
      },
      error: (error) => {
        console.error('Error loading user water boxes:', error);
        this.userWaterBoxes = [];
        this.paymentForm.get('waterBoxId')?.reset();
        // No mostrar error al usuario, solo log
        console.log('No se pudieron cargar las cajas de agua del usuario');
      }
    });
  }

  private clearUserData(): void {
    this.paymentForm.get('organizationId')?.reset();
    this.paymentForm.get('waterBoxId')?.reset();
    this.organizationName = '';
    this.userWaterBoxes = [];
    this.paymentForm.get('clientInfo')?.reset();
    this.selectedUser = null;
    this.searchTerm = '';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private createForm(): FormGroup {
    return this.fb.group({
      clientInfo: this.fb.group({
        documentType: [''],
        documentNumber: [''],
        firstName: [''],
        lastName: [''],
        phone: [''],
        email: [''],
        address: this.fb.group({
          localityName: [''],
          streetName: ['']
        })
      }),
      userId: ['', Validators.required],
      organizationId: ['', Validators.required],
      paymentCode: ['', Validators.required],
      waterBoxId: [''],
      paymentType: ['AGUA', Validators.required],
      paymentMethod: ['EFECTIVO', Validators.required],
      totalAmount: [{ value: 0, disabled: true }, Validators.required],
      paymentDate: [this.formatDate(new Date()), Validators.required],
      paymentStatus: ['PAGADO', Validators.required],
      externalReference: [''],
      details: this.fb.array([])
    });
  }

  get details(): FormArray {
    return this.paymentForm.get('details') as FormArray;
  }

  addDetail(): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const detailGroup = this.fb.group({
      concept: ['SERVICIO_AGUA', Validators.required],
      year: [{ value: currentYear, disabled: true }, Validators.required],
      month: [currentMonth, Validators.required],
      amount: [{ value: 10, disabled: true }, Validators.required],
      description: [''], // Se actualizará con updateDescription
      periodStart: [{ value: '', disabled: true }, Validators.required],
      periodEnd: [{ value: '', disabled: true }, Validators.required]
    });

    // Configurar listeners para cambios automáticos
    this.setupDetailListeners(detailGroup, this.details.length);

    this.details.push(detailGroup);

    // Calcular automáticamente las fechas del periodo
    this.updatePeriodDates(detailGroup, currentMonth, currentYear);

    // Actualizar la descripción con los valores iniciales
    this.updateDescription(detailGroup);

    // Recalcular el monto total
    this.calculateTotalAmount();
  }

  private setupDetailListeners(detailGroup: FormGroup, index: number): void {
    // Listener para cambio de concepto
    detailGroup.get('concept')?.valueChanges.subscribe(concept => {
      const selectedConcept = this.concepts.find(c => c.value === concept);
      if (selectedConcept) {
        detailGroup.get('amount')?.setValue(selectedConcept.amount);
        this.updateDescription(detailGroup);
        this.calculateTotalAmount();
      }
    });

    // Listener para cambio de mes
    detailGroup.get('month')?.valueChanges.subscribe(month => {
      const year = detailGroup.get('year')?.value;
      this.updatePeriodDates(detailGroup, month, year);
      this.updateDescription(detailGroup);
    });
  }

  private updatePeriodDates(detailGroup: FormGroup, month: number, year: number): void {
    if (month && year) {
      // Primer día del mes
      const startDate = new Date(year, month - 1, 1);
      // Último día del mes
      const endDate = new Date(year, month, 0);

      detailGroup.get('periodStart')?.setValue(this.formatDate(startDate));
      detailGroup.get('periodEnd')?.setValue(this.formatDate(endDate));
    }
  }

  private updateDescription(detailGroup: FormGroup): void {
    const concept = detailGroup.get('concept')?.value;
    const month = detailGroup.get('month')?.value;
    const year = detailGroup.get('year')?.value;

    const conceptLabel = this.concepts.find(c => c.value === concept)?.label || concept;
    const monthName = this.getMonthNameByNumber(Number(month)); // Convertir a número

    const description = `Pago de ${conceptLabel} - ${monthName} - ${year}`;
    detailGroup.get('description')?.setValue(description);
  }

  private calculateTotalAmount(): void {
    let total = 0;
    this.details.controls.forEach(control => {
      const amount = control.get('amount')?.value || 0;
      total += parseFloat(amount);
    });
    this.paymentForm.get('totalAmount')?.setValue(total);
  }

  private getMonthNameByNumber(monthNumber: number): string {
    console.log('getMonthNameByNumber called with:', monthNumber, 'type:', typeof monthNumber);
    const month = this.months.find(m => m.value === monthNumber);
    console.log('Found month:', month);
    return month ? month.name : '';
  }

  getMonthName(date: Date): string {
    const months = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    return months[date.getMonth()];
  }

  removeDetail(index: number): void {
    this.details.removeAt(index);
    this.calculateTotalAmount();
  }

  private loadPayment(): void {
    this.loading = true;
    this.paymentService.getById(this.paymentId!).subscribe({
      next: (payment: PaymentResponse) => {
        this.paymentForm.patchValue({
          organizationId: payment.organizationId,
          paymentCode: payment.paymentCode,
          userId: payment.userId,
          waterBoxId: payment.waterBoxId,
          paymentType: payment.paymentType,
          paymentMethod: payment.paymentMethod,
          totalAmount: payment.totalAmount,
          paymentDate: this.formatDate(new Date(payment.paymentDate)),
          paymentStatus: payment.paymentStatus,
          externalReference: payment.externalReference
        });

        // Set selected user for the searchable dropdown
        if (payment.userId) {
          const user = this.users.find(u => u.id === payment.userId);
          if (user) {
            this.selectedUser = user;
            this.searchTerm = `${user.firstName || ''} ${user.lastName || ''}`;
          }
        }

        if (payment.details && Array.isArray(payment.details)) {
          payment.details.forEach((detail: PaymentDetail, index: number) => {
            const detailGroup = this.fb.group({
              concept: [detail.concept, Validators.required],
              year: [{ value: detail.year, disabled: true }, Validators.required],
              month: [detail.month, Validators.required],
              amount: [{ value: detail.amount, disabled: true }, Validators.required],
              description: [detail.description],
              periodStart: [{ value: this.formatDate(new Date(detail.periodStart)), disabled: true }, Validators.required],
              periodEnd: [{ value: this.formatDate(new Date(detail.periodEnd)), disabled: true }, Validators.required]
            });

            // Configurar listeners para este detalle
            this.setupDetailListeners(detailGroup, index);

            this.details.push(detailGroup);
          });

          // Calcular el monto total
          this.calculateTotalAmount();
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el pago.', 'error');
      }
    });
  }

  submit(): void {
    if (this.paymentForm.invalid) {
      this.showErrorAlert = true;
      return;
    }

    // Verificar que el waterBoxId esté presente
    const waterBoxId = this.paymentForm.get('waterBoxId')?.value;
    if (!waterBoxId) {
      Swal.fire('Error', 'Debe seleccionar un usuario para obtener el número de suministro.', 'error');
      return;
    }

    this.submitting = true;

    // Prepara el payload
    const formValue = this.paymentForm.value;

    // Convertir fechas de los detalles correctamente y obtener valores de campos deshabilitados
    const formattedDetails: PaymentDRequest[] = this.details.controls.map((control: any) => ({
      concept: control.get('concept')?.value,
      year: parseInt(control.get('year')?.value),
      month: parseInt(control.get('month')?.value),
      amount: parseFloat(control.get('amount')?.value),
      description: control.get('description')?.value,
      periodStart: new Date(control.get('periodStart')?.value),
      periodEnd: new Date(control.get('periodEnd')?.value)
    }));

    if (this.isEditMode) {
      const updatePayload: PaymentUpdate = {
        organizationId: formValue.organizationId,
        paymentCode: formValue.paymentCode,
        userId: formValue.userId,
        waterBoxId: formValue.waterBoxId,
        paymentType: formValue.paymentType,
        paymentMethod: formValue.paymentMethod,
        totalAmount: parseFloat(this.paymentForm.get('totalAmount')?.value), // Obtener valor del campo deshabilitado
        paymentDate: new Date(formValue.paymentDate),
        paymentStatus: formValue.paymentStatus,
        externalReference: formValue.externalReference
      };

      this.paymentService.update(this.paymentId!, updatePayload).subscribe({
        next: (response) => {
          console.log('Payment updated successfully:', response);
          this.handleSuccess();
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          this.handleErrorWithMessage(error.message || 'Error al actualizar el pago');
        }
      });
    } else {
      const createPayload: PaymentCreate = {
        organizationId: formValue.organizationId,
        paymentCode: formValue.paymentCode,
        userId: formValue.userId,
        waterBoxId: formValue.waterBoxId,
        paymentType: formValue.paymentType,
        paymentMethod: formValue.paymentMethod,
        totalAmount: parseFloat(this.paymentForm.get('totalAmount')?.value), // Obtener valor del campo deshabilitado
        paymentDate: new Date(formValue.paymentDate),
        paymentStatus: formValue.paymentStatus,
        externalReference: formValue.externalReference,
        details: formattedDetails
      };

      console.log('Sending payment data:', createPayload);

      this.paymentService.create(createPayload).subscribe({
        next: (response) => {
          console.log('Payment created successfully:', response);
          this.handleSuccess();
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          this.handleErrorWithMessage(error.message || 'Error al crear el pago');
        }
      });
    }
  }

  private handleSuccess(): void {
    this.submitting = false;
    this.showSuccessAlert = true;
    Swal.fire('Éxito', 'Pago guardado correctamente.', 'success');
    setTimeout(() => {
      this.router.navigate(['/admin/payments']);
    }, 2000);
  }

  private handleError(): void {
    this.submitting = false;
    this.showErrorAlert = true;
    Swal.fire('Error', 'Ocurrió un error al guardar el pago. Verifique la información ingresada.', 'error');
  }

  private handleErrorWithMessage(message: string): void {
    this.submitting = false;
    this.showErrorAlert = true;
    Swal.fire('Error', message, 'error');
  }

  cancel(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se cancelará el registro del pago.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No'
    }).then(result => {
      if (result.isConfirmed) {
        this.router.navigate(['/admin/payments']);
      }
    });
  }

  private generatePaymentCode(): void {
    this.paymentService.getAllPayments().subscribe({
      next: (payments) => {
        // Filtrar solo códigos válidos que coincidan con el patrón JASS-001-XXXXXX
        const codes = payments
          .map(p => p.paymentCode)
          .filter(code => code && /^JASS-001-\d{6}$/.test(code));

        let maxNumber = 0;
        
        if (codes.length > 0) {
          codes.forEach(code => {
            const parts = code.split('-');
            if (parts.length === 3) {
              const numberPart = parts[2];
              const number = parseInt(numberPart, 10);
              if (!isNaN(number) && number > maxNumber) {
                maxNumber = number;
              }
            }
          });
        }

        const nextNumber = maxNumber + 1;
        const formattedNumber = String(nextNumber).padStart(6, '0');
        const newCode = `JASS-001-${formattedNumber}`;

        console.log('Generated payment code:', newCode);
        this.paymentForm.get('paymentCode')?.setValue(newCode);
      },
      error: (error) => {
        console.error('Error generating payment code:', error);
        // Generar código por defecto en caso de error
        const defaultCode = `JASS-001-000001`;
        this.paymentForm.get('paymentCode')?.setValue(defaultCode);
        Swal.fire('Advertencia', 'No se pudo generar el código de pago automáticamente. Se usará un código por defecto.', 'warning');
      }
    });
  }
}
