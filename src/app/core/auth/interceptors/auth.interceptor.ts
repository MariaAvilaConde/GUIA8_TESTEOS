import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  let modifiedReq = req;
  if (token && !req.headers.has('Authorization')) {
    modifiedReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('🚨 AuthInterceptor: HTTP Error caught:', {
        status: error.status,
        url: error.url,
        message: error.message,
        originalUrl: req.url,
        hasToken: !!token,
        tokenLength: token ? token.length : 0
      });

      if (error.status === 401) {
        // Logs detallados para debuggear
        const isAuthEndpoint = req.url.includes('/auth/');
        const isTokenValidation = req.url.includes('/validate');
        const isGatewayAuthEndpoint = req.url.includes('/gateway/auth/');
        const isDirectApiCall = req.url.includes('lab.vallegrande.edu.pe');

        console.log('🔍 AuthInterceptor 401 Analysis:', {
          url: req.url,
          isAuthEndpoint,
          isTokenValidation,
          isGatewayAuthEndpoint,
          isDirectApiCall,
          hasToken: !!token,
          shouldRedirect: isAuthEndpoint || isTokenValidation || isGatewayAuthEndpoint || !token
        });

        // Solo redirigir al login en casos muy específicos
        if ((isAuthEndpoint || isTokenValidation || isGatewayAuthEndpoint) && !isDirectApiCall) {
          console.log('🚪 AuthInterceptor: Authentication failed, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('currentUser');
          router.navigate(['/auth/login']);
        } else {
          console.log('⚠️ AuthInterceptor: Resource access denied, NOT redirecting to login');
          console.log('   This might be a permissions issue, not authentication failure');
          // Para otros tipos de 401, no redirigir automáticamente
          // Dejar que el componente maneje el error
        }
      }

      return throwError(() => error);
    })
  );
};
