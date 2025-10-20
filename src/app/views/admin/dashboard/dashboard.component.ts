import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationContextService } from '../../../core/services/organization-context.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { AuthUser } from '../../../core/models/auth.model';
import { UserResponseDTO, StatusUsers, RolesUsers } from '../../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  organizationInfo: any = null;
  organizationName: string = '';
  userStats: {
    total: number;
    active: number;
    clients: number;
    admins: number;
  } = {
      total: 0,
      active: 0,
      clients: 0,
      admins: 0
    };

  isLoading: boolean = true;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private organizationContextService: OrganizationContextService,
    private currentUserService: CurrentUserService
  ) { }

  ngOnInit(): void {
    this.initializeDashboard();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeDashboard(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.loadDashboardData();
        }
      })
    );

    this.subscriptions.add(
      this.organizationContextService.organizationContext$.subscribe(context => {
        this.organizationInfo = context;
      })
    );

    // Cargar información de la organización desde CurrentUserService
    this.subscriptions.add(
      this.currentUserService.getOrganizationInfo().subscribe(orgInfo => {
        if (orgInfo) {
          this.organizationName = orgInfo.organizationName;
        }
      })
    );
  }

  private loadDashboardData(): void {
    if (!this.currentUser?.id) {
      console.error('No user ID found for current user');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    console.log('Loading dashboard data for user:', this.currentUser.id);

    // Primero verificar si ya tenemos la información en storage
    const userInfo = this.currentUserService.getCurrentUserFromStorage();
    if (userInfo?.organization) {
      console.log('Organization info found in storage:', userInfo.organization.organizationName);
      this.organizationName = userInfo.organization.organizationName;
      this.isLoading = false;
    } else {
      // Si no tenemos la información cargada, usar el ID del usuario para cargarla
      console.log('Loading user info from API for user ID:', this.currentUser.id);
      this.currentUserService.getCurrentUserInfo(this.currentUser.id).subscribe({
        next: (fullUserInfo) => {
          console.log('User info loaded successfully:', fullUserInfo);
          this.organizationName = fullUserInfo.organization.organizationName;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading user info:', error);
          this.organizationName = 'Error al cargar organización';
          this.isLoading = false;
        }
      });
    }

    // Por ahora, mostrar estadísticas básicas
    this.userStats = {
      total: 1, // El usuario actual
      active: 1,
      clients: 0,
      admins: 1
    };
  }

  private calculateUserStats(users: UserResponseDTO[]): void {
    this.userStats = {
      total: users.length,
      active: users.filter(user => user.status === StatusUsers.ACTIVE).length,
      clients: users.filter(user => user.roles.includes(RolesUsers.CLIENT)).length,
      admins: users.filter(user => user.roles.includes(RolesUsers.ADMIN)).length
    };
  }

  getContextInfo() {
    return this.organizationContextService.getContextInfo();
  }

  getUserInitials(): string {
    if (!this.currentUser?.fullName) return 'NA';
    return this.currentUser.fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
