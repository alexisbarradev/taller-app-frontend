import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) {}

  /**
   * Check if user is logged in by verifying token exists and is valid
   */
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decoded.exp && decoded.exp < currentTime) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error decoding token:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Get the stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Store the JWT token
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Clear authentication data and redirect to login
   */
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  /**
   * Get user information from token
   */
  getUserInfo(): any {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Get username from token
   */
  getUsername(): string {
    const userInfo = this.getUserInfo();
    return userInfo?.sub || userInfo?.email || 'Invitado';
  }

  /**
   * Get user role from token
   */
  getRole(): string {
    const userInfo = this.getUserInfo();
    return userInfo?.role || '';
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp && decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
} 