import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router: Router,
    private msalService: MsalService
  ) {}

  /**
   * Verifica si hay un token válido en almacenamiento o MSAL
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    console.log('[isLoggedIn] Token:', token);
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        this.logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('[isLoggedIn] Error decoding token:', error, 'Token:', token);
      this.logout();
      return false;
    }
  }

  /**
   * Intenta adquirir el token desde MSAL
   */
  async acquireToken(): Promise<string | null> {
    const account = this.msalService.instance.getActiveAccount();
    if (!account) {
      console.warn('No active MSAL account found');
      return null;
    }

    try {
      const result: AuthenticationResult = await this.msalService.instance.acquireTokenSilent({
        scopes: ['openid', 'profile', 'email'],
        account
      });

      const token = result.accessToken;
      this.setToken(token); // opcional
      return token;
    } catch (error) {
      console.error('Failed to acquire token silently', error);
      return null;
    }
  }

  /**
   * Obtiene el token desde localStorage (o podrías extender a usar MSAL si lo prefieres)
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Almacena el token localmente
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Borra el token y redirige a login
   */
  logout(): void {
    // Clear MSAL caches
    this.msalService.instance.setActiveAccount(null);
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to Azure B2C logout endpoint
    const authority = 'https://proyectouc.b2clogin.com/proyectouc.onmicrosoft.com/B2C_1_UserCreated';
    const postLogoutRedirectUri = encodeURIComponent('http://localhost:4200/login');
    const logoutUrl = `${authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${postLogoutRedirectUri}`;
    window.location.href = logoutUrl;
  }

  /**
   * Devuelve los datos del usuario decodificados del token
   */
  getUserInfo(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Devuelve el username
   */
  getUsername(): string {
    // First try to get name from MSAL claims
    const msalName = this.getUsernameFromMSAL();
    if (msalName && msalName !== 'Invitado') {
      return msalName;
    }

    // Fallback to token claims
    const userInfo = this.getUserInfo();
    return userInfo?.name || userInfo?.given_name || userInfo?.preferred_username || userInfo?.email || 'Invitado';
  }

  /**
   * Gets username directly from MSAL claims
   */
  getUsernameFromMSAL(): string {
    const account = this.msalService.instance.getActiveAccount();
    if (account && account.idTokenClaims) {
      const claims: any = account.idTokenClaims;
      return claims.name || claims.given_name || claims.preferred_username || claims.email || 'Invitado';
    }
    return 'Invitado';
  }

  /**
   * Devuelve el rol si está en el token
   */
  getRole(): string {
    const userInfo = this.getUserInfo();
    return userInfo?.role || '';
  }

  /**
   * Verifica si el token expiró
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp && decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
}
