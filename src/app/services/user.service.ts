import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class UserService {
  getUsername(): string {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded?.sub || 'Invitado';
      } catch (err) {
        return 'Invitado';
      }
    }
    return 'Invitado';
  }

  getRole(): string {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        return decoded?.role || '';
      } catch (err) {
        return '';
      }
    }
    return '';
  }
} 