import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PaymentService } from '../../../../core/services/payment.service';
import { OrganizationService } from '../../../../core/services/organization.service';
import { OrganizationContextService } from '../../../../core/services/organization-context.service';
import { UserService } from '../../../../core/services/user.service';
import { BoxService } from '../../../../core/services/box.service';
import { PaymentResponse, PaymentDetail } from '../../../../core/models/payment.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-payment-detail',
  imports: [CommonModule],
  templateUrl: './payment-detail.component.html',
  styleUrl: './payment-detail.component.css'
})
export class PaymentDetailComponent implements OnInit {
  payment: PaymentResponse | null = null;
  organizationName: string = '';
  userName: string = '';
  waterBoxName: string = '';
  loading: boolean = true;
  error: string = '';

  months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private organizationService: OrganizationService,
    private organizationContextService: OrganizationContextService,
    private userService: UserService,
    private boxService: BoxService
  ) { }

  ngOnInit(): void {
    this.loadPaymentDetail();
  }

  loadPaymentDetail(): void {
    const paymentId = this.route.snapshot.paramMap.get('id');
    console.log('Loading payment with ID:', paymentId);

    if (!paymentId) {
      this.error = 'ID de pago no válido';
      this.loading = false;
      return;
    }

    this.paymentService.getById(paymentId).subscribe({
      next: (payment) => {
        console.log('Payment loaded:', payment);
        this.payment = payment;
        this.loadAdditionalData();
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        this.error = 'Error al cargar el detalle del pago';
        this.loading = false;
      }
    });
  }

  loadAdditionalData(): void {
    if (!this.payment) return;

    console.log('Loading additional data for payment:', this.payment);
    
    // Get organizationId from OrganizationContextService or payment data
    const organizationId = this.organizationContextService.getCurrentOrganizationId() || this.payment.organizationId;
    
    if (!organizationId) {
      console.error('No organization ID available for loading additional data');
      this.loading = false;
      return;
    }

    // Cargar organización
    this.organizationService.getOrganizationById(this.payment.organizationId).subscribe({
      next: (organization) => {
        console.log('Organization loaded:', organization);
        this.organizationName = organization?.organizationName || 'Organización no encontrada';
      },
      error: (error) => {
        console.error('Error loading organization:', error);
        this.organizationName = 'Error al cargar';
      }
    });

    // Cargar usuario
    this.userService.getUserById(this.payment.userId).subscribe({
      next: (user) => {
        console.log('User loaded:', user);
        this.userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario no encontrado';
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.userName = 'Error al cargar';
      }
    });

    // Cargar caja de agua - manejar tanto ID numérico como código de texto
    const waterBoxId = this.payment.waterBoxId;
    console.log('Water box ID:', waterBoxId, 'Type:', typeof waterBoxId);
    
    if (waterBoxId && !isNaN(Number(waterBoxId))) {
      // Si es un ID numérico, usar el servicio de cajas
      this.boxService.getWaterBoxById(Number(waterBoxId)).subscribe({
        next: (waterBox) => {
          console.log('Water box loaded:', waterBox);
          this.waterBoxName = waterBox?.boxCode || 'Caja de agua no encontrada';
        },
        error: (error) => {
          console.error('Error loading water box:', error);
          this.waterBoxName = 'Error al cargar';
        }
      });
    } else if (waterBoxId) {
      // Si es un código de texto, usarlo directamente
      console.log('Using water box code directly:', waterBoxId);
      this.waterBoxName = waterBoxId;
    } else {
      this.waterBoxName = 'No asignada';
    }

    this.loading = false;
  }

  getMonthName(monthNumber: number): string {
    if (monthNumber >= 1 && monthNumber <= 12) {
      return this.months[monthNumber - 1];
    }
    return 'Mes inválido';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPaymentTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'AGUA': 'Servicio de Agua',
      'REPOSICION': 'Reposición',
      'MIXTO': 'Mixto',
      'monthly': 'Mensual',
      'annual': 'Anual',
      'mixed': 'Mixto'
    };
    return types[type] || type;
  }

  getPaymentMethodLabel(method: string): string {
    const methods: { [key: string]: string } = {
      'EFECTIVO': 'Efectivo',
      'TRANSFERENCIA': 'Transferencia',
      'TARJETA': 'Tarjeta',
      'MIXTO': 'Mixto',
      'cash': 'Efectivo',
      'transfer': 'Transferencia',
      'card': 'Tarjeta'
    };
    return methods[method] || method;
  }

  getPaymentStatusLabel(status: string): string {
    const statuses: { [key: string]: string } = {
      'PENDIENTE': 'Pendiente',
      'PAGADO': 'Pagado',
      'CANCELADO': 'Cancelado',
      'pending': 'Pendiente',
      'completed': 'Completado',
      'failed': 'Fallido',
      'cancelled': 'Cancelado'
    };
    return statuses[status] || status;
  }

  goBack(): void {
    this.router.navigate(['/admin/payments']);
  }

  editPayment(): void {
    if (this.payment) {
      this.router.navigate(['/admin/payments/edit', this.payment.paymentId]);
    }
  }
}
