import { Component, OnInit, OnDestroy } from '@angular/core'; // <-- MODIFICADO
import { forkJoin, Subject, of } from 'rxjs'; // <-- MODIFICADO
import { debounceTime, distinctUntilChanged, takeUntil, map, catchError } from 'rxjs/operators'; // <-- AÑADIDO
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms'; // <-- MODIFICADO
import { BoxService } from '../../../infrastructure/services/box.service';
import { WaterBox, BoxType, Status } from 'app/core/models/box.model';
import { AuthService } from 'app/core/services/auth.service';
import { OrganizationService } from 'app/core/services/organization.service';

@Component({
  selector: 'app-water-box',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './water-box.component.html',
})
export class WaterBoxComponent implements OnInit, OnDestroy { // <-- MODIFICADO
  boxes: WaterBox[] = [];
  allBoxes: WaterBox[] = [];

  loading = false;
  showModal = false;
  isEdit = false;
  form: FormGroup;
  currentId: number | null = null;

  statusOptions = [Status.ACTIVE, Status.INACTIVE];
  boxTypes = Object.values(BoxType);
  showDetailsModal = false;
  selectedBox: WaterBox | null = null;

  // --- INICIO: CÓDIGO AÑADIDO PARA EL BUSCADOR ---
  searchControl = new FormControl('');
  private selectedTypeFilter: string = '';
  private unsubscribe$ = new Subject<void>();
  // --- FIN: CÓDIGO AÑADIDO PARA EL BUSCADOR ---

  organizationName: string = '';

  constructor(
    private boxService: BoxService,
    private fb: FormBuilder,
    private authService: AuthService,
    private organizationService: OrganizationService
  ) {
      this.form = this.fb.group({
        organizationId: ['', [Validators.required]],
        boxCode: [{value: '', disabled: true}, [Validators.required]],
        boxType: ['', Validators.required],
        installationDate: ['', Validators.required],
        status: [Status.ACTIVE, Validators.required]
      });
  }

  ngOnInit() {
    this.fetchBoxes();
    this.setupSearchListener(); // <-- AÑADIDO
  this.fetchOrganizationName();
   
  }

  // --- INICIO: CÓDIGO AÑADIDO PARA EL BUSCADOR ---
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  private setupSearchListener(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.unsubscribe$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  private applyFilters(): void {
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    let filteredData = [...this.allBoxes];

    if (this.selectedTypeFilter) {
      filteredData = filteredData.filter(box => box.boxType === this.selectedTypeFilter);
    }

    if (searchTerm) {
      filteredData = filteredData.filter(box => 
        box.boxCode.toLowerCase().includes(searchTerm)
      );
    }
    
    this.boxes = filteredData;
  }
  // --- FIN: CÓDIGO AÑADIDO PARA EL BUSCADOR ---

  fetchBoxes(activeOnly: boolean = true) {
    this.loading = true;
    const fetchObservable = activeOnly ? this.boxService.getAllActiveWaterBoxes() : this.boxService.getAllInactiveWaterBoxes();

    fetchObservable.subscribe({
      next: (boxes) => {
        // Usar el nombre fijo de la organización para todas las cajas (se guarda el id pero en el front mostramos el name)
        const fixedOrgId = '6896b2ecf3e398570ffd99d3';
        this.boxService.getOrganizationNameById(fixedOrgId).subscribe({
          next: (orgName) => {
            const updated = boxes.map(box => ({ ...box, organizationName: orgName }));
            this.allBoxes = updated.sort((a, b) => a.id - b.id);
            this.applyFilters();
            this.loading = false;
          },
          error: () => {
            // Fallback: usar texto simple si falla la consulta
            const updated = boxes.map(box => ({ ...box, organizationName: 'Organización no encontrada' }));
            this.allBoxes = updated.sort((a, b) => a.id - b.id);
            this.applyFilters();
            this.loading = false;
          }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  fetchInactiveBoxes() {
    this.fetchBoxes(false);
  }

  filterBoxesByType(event: Event) {
    this.selectedTypeFilter = (event.target as HTMLSelectElement).value; // <-- MODIFICADO
    this.applyFilters(); // <-- MODIFICADO
  }

  openModal(edit: boolean = false, box?: WaterBox) {
    this.showModal = true;
    this.isEdit = edit;
    if (edit && box) {
      this.currentId = box.id;
      this.form.patchValue({ ...box });
      this.form.get('organizationId')?.disable({ emitEvent: false });
      this.form.get('boxCode')?.disable({ emitEvent: false });
      // Obtener nombre de la organización para mostrarlo
      const orgId = box.organizationId;
      if (orgId) {
        this.boxService.getOrganizationNameById(orgId).subscribe({
          next: (name) => {
            console.log('Organización obtenida:', name);
            this.organizationName = name;
          },
          error: (err) => {
            console.error('Error al obtener la organización:', err);
            if (!this.organizationName) this.organizationName = 'Organización no encontrada';
          }
        });
      } else {
        this.organizationName = 'Sin organización asignada';
      }
    } else {
      this.currentId = null;
      this.form.reset({ status: Status.ACTIVE });
      const orgId = this.authService.getCurrentOrganizationId();
      if (!orgId) {
        this.showModal = false;
        Swal.fire('Error', 'Tu usuario no tiene una organización asignada. No es posible crear una caja de agua.', 'error');
        return;
      }
      this.form.get('organizationId')?.setValue(orgId, { emitEvent: false });
      this.form.get('organizationId')?.disable({ emitEvent: false });
      // Obtener nombre de la organización para mostrarlo desde la URL proporcionada
      this.boxService.getOrganizationNameById(orgId).subscribe({
        next: (name) => {
          console.log('Organización obtenida:', name);
          this.organizationName = name;
        },
        error: (err) => {
          console.error('Error al obtener la organización:', err);
          if (!this.organizationName) this.organizationName = 'Organización no encontrada';
        }
      });
      // Generar número único de suministro
      const uniqueNumber = this.generateSupplyNumber();
      this.form.get('boxCode')?.setValue(uniqueNumber, { emitEvent: false });
      this.form.get('boxCode')?.disable({ emitEvent: false });
    }
  }

  // Generador simple: timestamp + random
  private generateSupplyNumber(): string {
    const base = Math.floor(Date.now() / 1000); // segundos
    const rand = Math.floor(Math.random() * 100);
    return `${base}-${rand}`;
  }

  closeModal() {
    this.showModal = false;
    this.form.reset({ status: Status.ACTIVE });
    this.currentId = null;
  }

  viewDetails(box: WaterBox) {
    this.selectedBox = box;
    this.showDetailsModal = true;
  }

  fetchOrganizationName(): void {
    const organizationId = '6896b2ecf3e398570ffd99d3'; // ID fijo
    this.boxService.getOrganizationNameById(organizationId).subscribe({
      next: (name) => {
        this.organizationName = name;
      },
      error: () => {
        this.organizationName = 'Organización no encontrada';
      }
    });
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedBox = null;
  }

  submit() {
    if (this.form.invalid) {
      Swal.fire('Error', 'Por favor, complete todos los campos requeridos y válidos.', 'error');
      return;
    }
    const raw = this.form.getRawValue();
    const value = { ...raw };
    if (this.isEdit && this.currentId) {
      this.boxService.updateWaterBox(this.currentId, value).subscribe(() => {
        this.fetchBoxes();
        this.closeModal();
        Swal.fire('¡Actualizado!', 'La caja de agua ha sido actualizada.', 'success');
      });
    } else {
      this.boxService.createWaterBox(value).subscribe(() => {
        this.fetchBoxes();
        this.closeModal();
        Swal.fire('¡Creado!', 'La caja de agua ha sido creada.', 'success');
      });
    }
  }

  deleteBox(id: number) {
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
        this.boxService.deleteWaterBox(id).subscribe({
          next: () => {
            this.fetchBoxes();
            Swal.fire('¡Eliminado!', 'La caja de agua ha sido eliminada.', 'success');
          },
          error: (err) => {
            let errorMessage = 'No se pudo eliminar la caja de agua.';
            if (err.error && err.error.message && err.error.message.includes('asignación')) {
              errorMessage = 'No se puede eliminar la caja de agua porque tiene asignaciones activas.';
            } else if (err.error && err.error.message) {
              errorMessage = err.error.message;
            }
            Swal.fire('Error', errorMessage, 'error');
          }
        });
      }
    });
  }

  restoreBox(id: number) {
    Swal.fire({
      title: '¿Estás seguro de restaurar?',
      text: 'Esta acción restaurará la caja de agua.',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.boxService.restoreWaterBox(id).subscribe(() => {
          this.fetchBoxes();
          Swal.fire('¡Restaurado!', 'La caja de agua ha sido restaurada.', 'success');
        });
      }
    });
  }

}