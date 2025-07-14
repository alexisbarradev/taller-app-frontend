import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../../environments/environment';

export interface RolUsuario {
  id: number;
  nombre: string;
}

export interface EstadoUsuario {
  id: number;
  estado: string;
}

export interface Usuario {
  id: number;
  rut: string;
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  usuario: string;
  correo: string;
  numeroContacto?: string;
  urlContrato: string;
  direccion: string;
  proveedorAutenticacion: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  region?: { id: number; nombre: string };
  provincia?: { id: number; nombre: string };
  comuna?: { id: number; nombre: string };
  comunidad?: { id: number; nombreComunidad: string };
}

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
      // Prefer given_name, then email, then preferred_username, then name (if not 'unknown')
      if (claims.given_name) {
        return claims.given_name;
      }
      if (claims.email) {
        return claims.email;
      }
      if (claims.preferred_username) {
        return claims.preferred_username;
      }
      if (claims.name && claims.name !== 'unknown') {
        return claims.name;
      }
    }
    return 'Invitado';
  }

  // 📧 Obtener email del usuario desde MSAL
  getUserEmailFromMSAL(): string {
    const account = this.msalService.instance.getActiveAccount();
    if (account && account.idTokenClaims) {
      const claims: any = account.idTokenClaims;
      // Buscar en emails (array), email, preferred_username, upn, name
      const email =
        (Array.isArray(claims.emails) && claims.emails.length > 0 && claims.emails[0]) ||
        claims.email ||
        claims.preferred_username ||
        claims.upn ||
        claims.name ||
        '';
      console.log('[UserService] Claims disponibles:', claims);
      console.log('[UserService] Email extraído:', email);
      return email;
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

  async listarUsuarios(): Promise<Usuario[]> {
    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error('No autorizado. Debe ser administrador para ver la lista de usuarios.');
      }
      if (!response.ok) {
        throw new Error('Error al obtener la lista de usuarios');
      }
      return await response.json();
    } catch (error: any) {
      console.error('[UserService] listarUsuarios error:', error);
      throw error;
    }
  }

  async getUsuarioPorCorreo(correo: string): Promise<Usuario | null> {
    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/usuarios/correo/${encodeURIComponent(correo)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('[UserService] getUsuarioPorCorreo error:', error);
      return null;
    }
  }

  // Nuevo método solo para obtener el id por correo
  async getUsuarioIdPorCorreo(correo: string): Promise<number | null> {
    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/usuarios/id-por-correo/${encodeURIComponent(correo)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.id || null;
      }
      return null;
    } catch (error) {
      console.error('[UserService] getUsuarioIdPorCorreo error:', error);
      return null;
    }
  }

  async eliminarUsuario(id: number): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('No se pudo eliminar el usuario');
      }
    } catch (error) {
      console.error('[UserService] eliminarUsuario error:', error);
      throw error;
    }
  }

  async getUsuarioPorId(id: number): Promise<Usuario | null> {
    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/usuarios/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('[UserService] getUsuarioPorId error:', error);
      return null;
    }
  }

  async updateUsuario(id: number, usuario: any): Promise<void> {
    try {
      const token = this.authService.getToken();
      const response = await fetch(`${environment.apiUrl}/usuarios/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(usuario)
      });
      if (!response.ok) {
        throw new Error('No se pudo actualizar el usuario');
      }
    } catch (error) {
      console.error('[UserService] updateUsuario error:', error);
      throw error;
    }
  }
}