import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private rolUsuarioSubject = new BehaviorSubject<number | null>(null);
  private userNameSubject = new BehaviorSubject<string>('Invitado');
  private userEmailSubject = new BehaviorSubject<string>('');

  rolUsuario$ = this.rolUsuarioSubject.asObservable();
  userName$ = this.userNameSubject.asObservable();
  userEmail$ = this.userEmailSubject.asObservable();

  constructor(
    private authService: AuthService,
    private msalService: MsalService
  ) {}

  setRol(rol: number | null) {
    console.log('[UserService] setRol:', rol);
    this.rolUsuarioSubject.next(rol);
  }
  setUserName(name: string) {
    console.log('[UserService] setUserName:', name);
    this.userNameSubject.next(name);
  }
  setUserEmail(email: string) {
    console.log('[UserService] setUserEmail:', email);
    this.userEmailSubject.next(email);
  }

  getRol(): number | null {
    return this.rolUsuarioSubject.value;
  }
  getUserName(): string {
    return this.userNameSubject.value;
  }
  getUserEmail(): string {
    return this.userEmailSubject.value;
  }

  clearRol(): void {
    this.setRol(null);
  }

  // 🔍 Obtener rol del usuario desde el backend
  async obtenerRolPorCorreo(correo: string): Promise<number | null> {
    try {
      const token = this.authService.getToken();
      if (!token) {
        console.warn('⚠️ No hay token disponible para obtener rol');
        return null;
      }

      // Add timeout to prevent long waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${environment.apiUrl}/usuarios/correo/${encodeURIComponent(correo)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rol = data.rol;
        this.setRol(rol);
        console.log('✅ Rol obtenido del backend:', rol);
        return rol;
      } else if (response.status === 404) {
        console.log('⚠️ Usuario no encontrado en el backend');
        this.setRol(null);
        return null;
      } else {
        console.error('❌ Error al obtener rol:', response.status, response.statusText);
        this.setRol(null);
        return null;
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ Timeout al obtener rol del backend');
      } else {
        console.error('❌ Error al llamar al endpoint de rol:', error);
      }
      this.setRol(null);
      return null;
    }
  }

  // 👤 Obtener nombre del usuario desde MSAL
  getUserNameFromMSAL(): string {
    const account = this.msalService.instance.getActiveAccount();
    if (account && account.idTokenClaims) {
      const claims: any = account.idTokenClaims;
      return claims.name || claims.given_name || claims.preferred_username || claims.email || 'Invitado';
    }
    return 'Invitado';
  }

  // 📧 Obtener email del usuario desde MSAL
  getUserEmailFromMSAL(): string {
    const account = this.msalService.instance.getActiveAccount();
    if (account && account.idTokenClaims) {
      const claims: any = account.idTokenClaims;
      return claims.email || claims.preferred_username || '';
    }
    return '';
  }

  // Métodos delegados a AuthService
  getUsername(): string {
    return this.authService.getUsername();
  }

  getRoleFromToken(): string {
    return this.authService.getRole();
  }

  getUserInfo(): any {
    return this.authService.getUserInfo();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
}
