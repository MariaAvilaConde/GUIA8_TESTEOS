import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RolesUsers } from '../../models/user.model';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🛡️ AdminGuard: Checking authentication for route:', state.url);
  console.log('🛡️ AdminGuard: Current timestamp:', new Date().toISOString());

  const isAuth = authService.isAuthenticated();
  console.log('🛡️ AdminGuard: isAuthenticated():', isAuth);

  if (!isAuth) {
    console.log('❌ AdminGuard: Not authenticated, redirecting to login');
    console.log('🛡️ AdminGuard: Current user:', authService.getCurrentUser());
    console.log('🛡️ AdminGuard: Token exists:', !!authService.getCurrentUser());
    router.navigate(['/auth/login']);
    return false;
  }

  console.log('🛡️ AdminGuard: Checking role selection...');
  const needsRoleSelection = authService.needsRoleSelection();
  console.log('🛡️ AdminGuard: needsRoleSelection():', needsRoleSelection);

  if (needsRoleSelection) {
    console.log('⚠️ AdminGuard: Role selection needed, redirecting to role selector');
    router.navigate(['/role-selector']);
    return false;
  }

  console.log('🛡️ AdminGuard: Getting active role...');
  const activeRole = authService.getActiveRole();
  console.log('🛡️ AdminGuard: Active role is:', activeRole);
  console.log('🛡️ AdminGuard: Valid admin roles:', [RolesUsers.ADMIN, RolesUsers.SUPER_ADMIN]);

  if (activeRole !== RolesUsers.ADMIN && activeRole !== RolesUsers.SUPER_ADMIN) {
    console.log('❌ AdminGuard: Invalid role, redirecting to unauthorized');
    console.log('🛡️ AdminGuard: Current role:', activeRole);
    router.navigate(['/unauthorized']);
    return false;
  }

  console.log('🛡️ AdminGuard: Getting organization ID...');
  const organizationId = authService.getCurrentOrganizationId();
  console.log('🛡️ AdminGuard: Organization ID is:', organizationId);

  // TEMPORALMENTE COMENTADO PARA DEBUG
  // if (!organizationId) {
  //   console.error('AdminGuard: Usuario administrador sin organizationId');
  //   router.navigate(['/unauthorized']);
  //   return false;
  // }

  console.log('✅ AdminGuard: All checks passed, allowing access to:', state.url);

  return true;
};
