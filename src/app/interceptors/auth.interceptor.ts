import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Si no hay token, sigue sin modificar
  if (!token) return next(req);

  // Endpoints públicos que NO deben llevar token
  const publicEndpoints = [
    '/geografia/',
    '/comunidad/',
    '/regiones/',
    '/provincias/',
    '/comunas/'
  ];

  // Si la URL es pública, no agregues el token
  if (publicEndpoints.some(url => req.url.includes(url))) {
    return next(req);
  }

  // Clona la request y agrega el Authorization header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
